import React, { createElement } from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';

// The entry module must stay JSX-free: Vite parses it directly (to inline
// asset refs) before any JSX transform can run. Everything with JSX lives in
// App.js and below, which esbuild transforms with the jsx loader.
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(createElement(React.StrictMode, null, createElement(App)));
