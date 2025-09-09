import { initExpenseDom } from './src/expense-dom.js';

// Thin initializer to wire DOM behavior on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initExpenseDom(document);
  });
}

export default {};