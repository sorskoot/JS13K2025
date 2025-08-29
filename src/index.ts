import './components/hello-component.js';
import './components/paw.js';

DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
