import { MessageFormatting } from '../components/MessageComposer/RichTextComposer';

export interface ParsedMessage {
  text: string;
  formatting: MessageFormatting;
}

export interface FormattedSegment {
  text: string;
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeBlock' | 'quote' | 'link' | 'mention';
  data?: {
    url?: string;
    userId?: string;
    username?: string;
    language?: string;
  };
}

/**
 * Parse Markdown-style formatting from text
 * Supports: **bold**, *italic*, `code`, ```codeblock```, > quote, [text](url), @username
 */
export function parseMessageFormatting(text: string): ParsedMessage {
  const formatting: MessageFormatting = {};
  
  // Find all formatting patterns without modifying the original text
  // This ensures correct positioning for all overlapping formats
  
  // Parse bold text **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  const bold: Array<{ start: number; end: number }> = [];
  while ((match = boldRegex.exec(text)) !== null) {
    bold.push({ 
      start: match.index, 
      end: match.index + match[0].length 
    });
  }
  if (bold.length > 0) formatting.bold = bold;

  // Parse italic text *text* (but not **text**)
  const italicRegex = /(?<!\*)\*([^*]+?)\*(?!\*)/g;
  const italic: Array<{ start: number; end: number }> = [];
  italicRegex.lastIndex = 0; // Reset regex
  while ((match = italicRegex.exec(text)) !== null) {
    italic.push({ 
      start: match.index, 
      end: match.index + match[0].length 
    });
  }
  if (italic.length > 0) formatting.italic = italic;

  // Parse inline code `code`
  const codeRegex = /`([^`]+?)`/g;
  const code: Array<{ start: number; end: number }> = [];
  while ((match = codeRegex.exec(text)) !== null) {
    code.push({ 
      start: match.index, 
      end: match.index + match[0].length 
    });
  }
  if (code.length > 0) formatting.code = code;

  // Parse code blocks ```code```
  const codeBlockRegex = /```(\w+)?\n?(.*?)```/gs;
  const codeBlock: Array<{ start: number; end: number; language?: string }> = [];
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlock.push({ 
      start: match.index, 
      end: match.index + match[0].length,
      language: match[1] || 'text'
    });
  }
  if (codeBlock.length > 0) formatting.codeBlock = codeBlock;

  // Parse quotes > text
  const quoteRegex = /^>\s(.+)$/gm;
  const quote: Array<{ start: number; end: number }> = [];
  while ((match = quoteRegex.exec(text)) !== null) {
    quote.push({ 
      start: match.index, 
      end: match.index + match[0].length 
    });
  }
  if (quote.length > 0) formatting.quote = quote;

  // Parse images ![text](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const image: Array<{ start: number; end: number; url: string; alt: string }> = [];
  while ((match = imageRegex.exec(text)) !== null) {
    image.push({ 
      start: match.index, 
      end: match.index + match[0].length,
      alt: match[1] || 'Image',
      url: match[2] 
    });
  }
  if (image.length > 0) formatting.image = image;

  // Parse links [text](url) (must come after images to avoid conflicts)
  const linkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  const link: Array<{ start: number; end: number; url: string }> = [];
  while ((match = linkRegex.exec(text)) !== null) {
    link.push({ 
      start: match.index, 
      end: match.index + match[0].length,
      url: match[2] 
    });
  }
  if (link.length > 0) formatting.link = link;

  // Parse mentions @username
  const mentionRegex = /@(\w+)/g;
  const mention: Array<{ start: number; end: number; userId: string; username: string }> = [];
  while ((match = mentionRegex.exec(text)) !== null) {
    mention.push({ 
      start: match.index, 
      end: match.index + match[0].length,
      userId: match[1], // In real app, would resolve username to userId
      username: match[1] 
    });
  }
  if (mention.length > 0) formatting.mention = mention;

  // Return original text with formatting positions
  return { text, formatting };
}

/**
 * Convert formatted message back to markdown
 */
export function formatMessageToMarkdown(text: string, formatting: MessageFormatting): string {
  let markdown = text;
  const sortedFormats: Array<{ start: number; end: number; prefix: string; suffix: string; priority: number }> = [];

  // Collect all formatting with priorities (higher priority = applied first)
  if (formatting.bold) {
    formatting.bold.forEach(({ start, end }) => {
      sortedFormats.push({ start, end, prefix: '**', suffix: '**', priority: 1 });
    });
  }

  if (formatting.italic) {
    formatting.italic.forEach(({ start, end }) => {
      sortedFormats.push({ start, end, prefix: '*', suffix: '*', priority: 2 });
    });
  }

  if (formatting.code) {
    formatting.code.forEach(({ start, end }) => {
      sortedFormats.push({ start, end, prefix: '`', suffix: '`', priority: 3 });
    });
  }

  if (formatting.link) {
    formatting.link.forEach(({ start, end, url }) => {
      sortedFormats.push({ start, end, prefix: '[', suffix: `](${url})`, priority: 4 });
    });
  }

  // Sort by start position (reverse order for proper insertion)
  sortedFormats.sort((a, b) => b.start - a.start);

  // Apply formatting
  sortedFormats.forEach(({ start, end, prefix, suffix }) => {
    markdown = markdown.slice(0, start) + prefix + markdown.slice(start, end) + suffix + markdown.slice(end);
  });

  return markdown;
}

/**
 * Render formatted message as HTML
 */
export function renderFormattedMessage(text: string, formatting: MessageFormatting): string {
  if (!formatting || Object.keys(formatting).length === 0) {
    return escapeHtml(text);
  }

  // Create a sorted list of all formatting ranges
  const ranges: Array<{
    start: number;
    end: number;
    type: keyof MessageFormatting;
    data?: any;
  }> = [];

  Object.entries(formatting).forEach(([type, rangeArray]) => {
    if (rangeArray) {
      rangeArray.forEach((range: any) => {
        ranges.push({
          start: range.start,
          end: range.end,
          type: type as keyof MessageFormatting,
          data: range
        });
      });
    }
  });

  // Sort by start position, then by end position (longer ranges first)
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);

  let result = '';
  let lastIndex = 0;

  for (const range of ranges) {
    // Add any unformatted text before this range
    if (range.start > lastIndex) {
      result += escapeHtml(text.substring(lastIndex, range.start));
    }

    // Extract the content inside the formatting markers
    const rawContent = text.substring(range.start, range.end);
    let content = rawContent;
    let htmlContent = '';

    switch (range.type) {
      case 'bold':
        // Remove ** markers and wrap in <strong>
        content = rawContent.replace(/^\*\*(.*)\*\*$/, '$1');
        htmlContent = `<strong>${escapeHtml(content)}</strong>`;
        break;
      case 'italic':
        // Remove * markers and wrap in <em>
        content = rawContent.replace(/^\*(.*)\*$/, '$1');
        htmlContent = `<em>${escapeHtml(content)}</em>`;
        break;
      case 'code':
        // Remove ` markers and wrap in <code>
        content = rawContent.replace(/^`(.*)`$/, '$1');
        htmlContent = `<code>${escapeHtml(content)}</code>`;
        break;
      case 'codeBlock':
        // Remove ``` markers and wrap in <pre><code>
        const codeBlockMatch = rawContent.match(/^```(\w+)?\n?(.*?)```$/s);
        if (codeBlockMatch) {
          const language = codeBlockMatch[1] || 'text';
          content = codeBlockMatch[2];
          htmlContent = `<pre><code class="language-${language}">${escapeHtml(content)}</code></pre>`;
        } else {
          htmlContent = escapeHtml(rawContent);
        }
        break;
      case 'quote':
        // Remove > marker and wrap in <blockquote>
        content = rawContent.replace(/^>\s(.+)$/m, '$1');
        htmlContent = `<blockquote>${escapeHtml(content)}</blockquote>`;
        break;
      case 'image':
        // Extract image alt text and URL
        const imageMatch = rawContent.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
          const alt = imageMatch[1] || 'Image';
          const url = imageMatch[2];
          htmlContent = `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="max-width: 100%; max-height: 200px; border-radius: 8px;" loading="lazy" />`;
        } else {
          htmlContent = escapeHtml(rawContent);
        }
        break;
      case 'link':
        // Extract link text and URL
        const linkMatch = rawContent.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          content = linkMatch[1];
          const url = linkMatch[2];
          htmlContent = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(content)}</a>`;
        } else {
          htmlContent = escapeHtml(rawContent);
        }
        break;
      case 'mention':
        // Extract username from @username
        const mentionMatch = rawContent.match(/^@(\w+)$/);
        if (mentionMatch) {
          const username = mentionMatch[1];
          htmlContent = `<span class="mention" data-user-id="${escapeHtml(username)}">@${escapeHtml(username)}</span>`;
        } else {
          htmlContent = escapeHtml(rawContent);
        }
        break;
      default:
        htmlContent = escapeHtml(rawContent);
    }

    result += htmlContent;
    lastIndex = range.end;
  }

  // Add any remaining unformatted text
  if (lastIndex < text.length) {
    result += escapeHtml(text.substring(lastIndex));
  }

  return result;
}

/**
 * Get formatted segments for custom rendering
 */
export function getFormattedSegments(text: string, formatting: MessageFormatting): FormattedSegment[] {
  const segments: FormattedSegment[] = [];
  const formatMap = new Map<number, Array<{ type: keyof MessageFormatting; data?: any }>>();

  // Build format map
  Object.entries(formatting).forEach(([type, ranges]) => {
    if (ranges) {
      ranges.forEach((range: any) => {
        if (!formatMap.has(range.start)) {
          formatMap.set(range.start, []);
        }
        if (!formatMap.has(range.end)) {
          formatMap.set(range.end, []);
        }
        formatMap.get(range.start)!.push({ type: type as keyof MessageFormatting, data: range });
      });
    }
  });

  // Process text with formatting
  let currentPos = 0;
  const activeFormats = new Set<string>();
  const sortedPositions = Array.from(formatMap.keys()).sort((a, b) => a - b);

  for (const pos of sortedPositions) {
    if (pos > currentPos) {
      // Add text segment
      const segmentText = text.slice(currentPos, pos);
      if (segmentText) {
        const primaryFormat = activeFormats.size > 0 ? Array.from(activeFormats)[0] : 'text';
        segments.push({
          text: segmentText,
          type: primaryFormat as any,
        });
      }
      currentPos = pos;
    }

    // Update active formats
    const formats = formatMap.get(pos) || [];
    formats.forEach(({ type, data }) => {
      if (activeFormats.has(type)) {
        activeFormats.delete(type);
      } else {
        activeFormats.add(type);
      }
    });
  }

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.slice(currentPos);
    segments.push({
      text: remainingText,
      type: 'text',
    });
  }

  return segments;
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Extract plain text from formatted message
 */
export function extractPlainText(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
             .replace(/\*(.*?)\*/g, '$1')
             .replace(/`(.*?)`/g, '$1')
             .replace(/```[\s\S]*?```/g, '[code block]')
             .replace(/^>\s(.+)$/gm, '$1')
             .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/**
 * Check if message contains formatting
 */
export function hasFormatting(formatting: MessageFormatting): boolean {
  return Object.values(formatting).some(ranges => ranges && ranges.length > 0);
}

/**
 * Validate message formatting
 */
export function validateFormatting(text: string, formatting: MessageFormatting): boolean {
  const textLength = text.length;
  
  for (const [type, ranges] of Object.entries(formatting)) {
    if (ranges) {
      for (const range of ranges) {
        if (range.start < 0 || range.end > textLength || range.start >= range.end) {
          return false;
        }
      }
    }
  }
  
  return true;
}