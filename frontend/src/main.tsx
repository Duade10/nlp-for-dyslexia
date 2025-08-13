import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Ensure this path is correct for your App component
import './index.css'; // Your main CSS file with Tailwind directives

ReactDOM.createRoot(document.getElementById('root')!).render(
  // REMOVE <React.StrictMode> AND </React.StrictMode>
  <App />
);