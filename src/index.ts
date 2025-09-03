import './components/world.js';
import './components/paw.js';
import './components/mouse.js';
import './components/smooth-locomotion.js';
import './components/snap-rotate.js';
import './components/shoot.js';
import './systems/game.js';

declare const DEBUG: boolean;
DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
