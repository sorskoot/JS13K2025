import './components/hello-component';

//#ifdef DEBUG
new EventSource('/esbuild').addEventListener('change', () => location.reload());
//#endif