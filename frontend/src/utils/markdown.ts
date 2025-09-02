import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// Configure marked with custom renderer for security and styling
const renderer = new marked.Renderer();

// Custom heading renderer
renderer.heading = (text, level) => {
  const sizes = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-semibold', 
    3: 'text-lg font-medium',
    4: 'text-base font-medium',
    5: 'text-sm font-medium',
    6: 'text-sm font-normal'
  };
  const className = sizes[level as keyof typeof sizes] || sizes[6];
  return `<h${level} class="${className} text-white my-2">${text}</h${level}>`;
};

// Custom strikethrough renderer
renderer.del = (text) => {
  return `<del class="line-through text-gray-400">${text}</del>`;
};

// Custom link renderer for security
renderer.link = (href, title, text) => {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const safeHref = isExternal ? href : '#';
  const titleAttr = title ? `title="${DOMPurify.sanitize(title)}"` : '';
  const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
  
  return `<a href="${safeHref}" ${titleAttr} ${target} class="text-blue-400 hover:text-blue-300 underline">${text}</a>`;
};

// Custom code renderer with syntax highlighting
renderer.code = (code, language) => {
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  
  return `
    <pre class="bg-gray-800 border border-gray-600 rounded-lg p-3 my-2 overflow-x-auto">
      <code class="text-sm text-gray-100 hljs language-${validLanguage}">${highlighted}</code>
    </pre>
  `;
};

// Custom inline code renderer
renderer.codespan = (text) => {
  return `<code class="bg-gray-700 text-blue-300 px-1 py-0.5 rounded text-sm">${DOMPurify.sanitize(text)}</code>`;
};

// Custom blockquote renderer
renderer.blockquote = (quote) => {
  return `<blockquote class="border-l-4 border-blue-500 bg-gray-800/50 pl-4 py-2 italic text-gray-300 my-2 rounded-r-lg">${quote}</blockquote>`;
};

// Custom table renderer
renderer.table = (header, body) => {
  return `
    <table class="w-full border-collapse border border-gray-600 my-2 rounded-lg overflow-hidden">
      <thead class="bg-gray-700">${header}</thead>
      <tbody>${body}</tbody>
    </table>
  `;
};

renderer.tablerow = (content) => {
  return `<tr class="border-b border-gray-600">${content}</tr>`;
};

renderer.tablecell = (content, flags) => {
  const tag = flags.header ? 'th' : 'td';
  const className = flags.header ? 'px-3 py-2 text-left font-semibold text-white' : 'px-3 py-2 text-gray-300';
  return `<${tag} class="${className}">${content}</${tag}>`;
};

// Custom paragraph renderer
renderer.paragraph = (text) => {
  return `<p class="my-1">${text}</p>`;
};

// Custom list renderers
renderer.list = (body, ordered) => {
  const tag = ordered ? 'ol' : 'ul';
  const className = ordered ? 'list-decimal list-inside' : 'list-disc list-inside';
  return `<${tag} class="${className} my-2 ml-2">${body}</${tag}>`;
};

renderer.listitem = (text) => {
  return `<li class="my-1">${text}</li>`;
};

// Custom emphasis renderers
renderer.strong = (text) => {
  return `<strong class="font-bold text-white">${text}</strong>`;
};

renderer.em = (text) => {
  return `<em class="italic text-gray-200">${text}</em>`;
};

// Configure marked options
marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
  pedantic: false,
});

// DOMPurify configuration for security
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'del', 'code', 'pre', 
    'a', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 
    'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'sub', 'sup', 'mark', 'ins', 'kbd', 'details', 'summary'
  ],
  ALLOWED_ATTR: [
    'href', 'title', 'target', 'rel', 'class', 'data-spoiler'
  ],
  ALLOWED_SCHEMES: ['http', 'https'],
  ALLOW_DATA_ATTR: true,
};

/**
 * Safely parse markdown text to HTML with custom extensions
 */
export function parseMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    // Pre-process custom syntax
    let processedText = text;
    
    // Handle spoiler text ||text||
    processedText = processedText.replace(
      /\|\|([^|]+)\|\|/g,
      '<span class="spoiler bg-gray-700 text-gray-700 hover:text-white hover:bg-gray-600 cursor-pointer transition-all px-1 rounded" data-spoiler="true">$1</span>'
    );
    
    // Handle underline __text__ (different from bold)
    processedText = processedText.replace(
      /(?<!_)__([^_]+)__(?!_)/g,
      '<u class="underline text-blue-300">$1</u>'
    );
    
    // Handle highlight ==text==
    processedText = processedText.replace(
      /==([^=]+)==/g,
      '<mark class="bg-yellow-400 text-black px-1 rounded">$1</mark>'
    );
    
    // Handle keyboard keys [[key]]
    processedText = processedText.replace(
      /\[\[([^\]]+)\]\]/g,
      '<kbd class="bg-gray-600 text-white px-2 py-1 rounded text-xs font-mono border border-gray-500 shadow-sm">$1</kbd>'
    );
    
    // Auto-detect URLs
    processedText = autoLinkUrls(processedText);
    
    // Parse with marked
    const html = marked.parse(processedText) as string;
    
    // Sanitize with DOMPurify
    const sanitizedHtml = DOMPurify.sanitize(html, purifyConfig);
    
    return sanitizedHtml;
  } catch (error) {
    console.error('Markdown parsing error:', error);
    // Fallback to escaped plain text
    return DOMPurify.sanitize(text);
  }
}

/**
 * Check if text contains markdown formatting
 */
export function hasMarkdownFormatting(text: string): boolean {
  if (!text) return false;
  
  // Enhanced markdown patterns
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,       // bold **text**
    /\*[^*]+\*/,           // italic *text*
    /__[^_]+__/,           // underline __text__
    /_[^_]+_/,             // italic _text_
    /~~[^~]+~~/,           // strikethrough ~~text~~
    /`[^`]+`/,             // inline code `text`
    /```[\s\S]*?```/,      // code blocks
    /^\s*[-*+]\s+/m,       // lists
    /^\s*\d+\.\s+/m,       // numbered lists
    /^\s*>\s+/m,           // blockquotes
    /\[.*?\]\(.*?\)/,      // links [text](url)
    /^#{1,6}\s+/m,         // headers
    /\|\|[^|]+\|\|/,       // spoiler ||text||
    /==[^=]+==/,           // highlight ==text==
    /\[\[[^\]]+\]\]/,      // keyboard keys [[key]]
    /https?:\/\//,         // URLs
    /^\s*\|.+\|\s*$/m,     // tables
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * Extract plain text from markdown
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  
  try {
    // Parse to HTML then extract text
    const html = marked.parse(text) as string;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
  } catch (error) {
    console.error('Error stripping markdown:', error);
    return text;
  }
}

/**
 * Get supported markdown formatting help
 */
export const RICH_TEXT_HELP = {
  // Basic formatting
  bold: '**bold text**',
  italic: '*italic text* or _italic text_',
  underline: '__underlined text__',
  strikethrough: '~~strikethrough text~~',
  
  // Code formatting
  code: '`inline code`',
  codeBlock: '```\ncode block\n```',
  
  // Links and media
  link: '[link text](https://example.com)',
  autoLink: 'https://example.com (auto-detected)',
  
  // Structure
  header1: '# Large Header',
  header2: '## Medium Header', 
  header3: '### Small Header',
  quote: '> quoted text',
  
  // Lists
  bulletList: '- list item\n- another item',
  numberedList: '1. first item\n2. second item',
  
  // Advanced
  spoiler: '||spoiler text||',
  highlight: '==highlighted text==',
  keyboard: '[[Ctrl+C]] keyboard shortcut',
  
  // Tables
  table: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |',
} as const;

// Legacy support
export const MARKDOWN_HELP = RICH_TEXT_HELP;

/**
 * Auto-detect and convert URLs to links
 */
export function autoLinkUrls(text: string): string {
  // URL regex pattern
  const urlRegex = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/g;
  
  return text.replace(urlRegex, (url) => {
    const sanitized = sanitizeUrl(url);
    if (sanitized) {
      return `[${url}](${sanitized})`;
    }
    return url;
  });
}

/**
 * Validate and sanitize URLs for links
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return '';
    }
    return urlObj.href;
  } catch {
    return '';
  }
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Format text with advanced features
 */
export function formatText(text: string, format: string): string {
  const formats = {
    bold: (t: string) => `**${t}**`,
    italic: (t: string) => `*${t}*`,
    underline: (t: string) => `__${t}__`,
    strikethrough: (t: string) => `~~${t}~~`,
    code: (t: string) => `\`${t}\``,
    spoiler: (t: string) => `||${t}||`,
    highlight: (t: string) => `==${t}==`,
    quote: (t: string) => `> ${t}`,
    h1: (t: string) => `# ${t}`,
    h2: (t: string) => `## ${t}`,
    h3: (t: string) => `### ${t}`,
  };
  
  const formatter = formats[format as keyof typeof formats];
  return formatter ? formatter(text) : text;
}