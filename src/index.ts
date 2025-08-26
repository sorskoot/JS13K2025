import './components/hello-component';

DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
