import { initTodoDom } from './src/todo-dom.js';

// Thin initializer that wires up the app on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  initTodoDom(document);
});
