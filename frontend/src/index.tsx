import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Disable right-click context menu (disabled during development)
// document.addEventListener('contextmenu', (e) => {
//   e.preventDefault();
// });

// Disable F12, Ctrl+Shift+I, Ctrl+U, and other dev tools shortcuts (disabled during development)
// document.addEventListener('keydown', (e) => {
//   if (
//     e.key === 'F12' ||
//     (e.ctrlKey && e.shiftKey && e.key === 'I') ||
//     (e.ctrlKey && e.shiftKey && e.key === 'J') ||
//     (e.ctrlKey && e.key === 'U')
//   ) {
//     e.preventDefault();
//   }
// });

// Disable drag and drop (disabled during development)
// document.addEventListener('dragstart', (e) => {
//   e.preventDefault();
// });

// Warn about developer tools (disabled during development)
// let devtools = {
//   open: false,
//   orientation: null
// };

// const threshold = 160;

// setInterval(() => {
//   if (
//     window.outerHeight - window.innerHeight > threshold ||
//     window.outerWidth - window.innerWidth > threshold
//   ) {
//     if (!devtools.open) {
//       devtools.open = true;
//       console.clear();
//       console.log(
//         '%c⚠️ PRIVACY WARNING ⚠️',
//         'color: red; font-size: 20px; font-weight: bold;'
//       );
//       console.log(
//         '%cThis is an ephemeral chat application. Developer tools compromise anonymity.',
//         'color: orange; font-size: 14px;'
//       );
//     }
//   } else {
//     devtools.open = false;
//   }
// }, 500);

root.render(
  // Temporarily disable StrictMode to debug WebSocket connection issues
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);