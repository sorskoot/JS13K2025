import './components/world.js';
import './components/paw.js';
import './components/mouse.js';
import './components/smooth-locomotion.js';

declare const DEBUG: boolean;
DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
