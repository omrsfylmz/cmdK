import React from 'react';
import ReactDOM from 'react-dom/client';
import CommandMenu from '../components/CommandMenu';
import styles from '../index.css?inline';

const rootId = 'cmdk-extension-root';

// Avoid multiple injections
if (!document.getElementById(rootId)) {
  const root = document.createElement('div');
  root.id = rootId;
  document.documentElement.appendChild(root);

  // Open shadow root
  const shadow = root.attachShadow({ mode: 'open' });

  // Inject styles into shadow root
  const style = document.createElement('style');
  style.textContent = styles;
  shadow.appendChild(style);

  // Mount Point
  const appRoot = document.createElement('div');
  appRoot.classList.add('font-sans'); // Apply base font class if needed
  shadow.appendChild(appRoot);

  ReactDOM.createRoot(appRoot).render(
    <React.StrictMode>
      <CommandMenu />
    </React.StrictMode>
  );
}
