import React, { useEffect } from 'react';
import { useAppSelector } from '../../hooks/redux';

const PrivacyProtection: React.FC = () => {
  const { screenShotBlocked } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (!screenShotBlocked) return;

    // Disable text selection for privacy
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // Disable drag and drop for privacy
    const handleDragStart = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // Disable certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) || // Mac screenshot shortcuts
        (e.ctrlKey && e.key === 's') || // Save page
        (e.ctrlKey && e.key === 'p') // Print page
      ) {
        e.preventDefault();
        // Optionally show a message
        console.log('Action blocked for privacy protection');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Apply CSS for additional protection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      @media print {
        * {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.head.removeChild(style);
    };
  }, [screenShotBlocked]);

  return null; // This component doesn't render anything visible
};

export default PrivacyProtection;