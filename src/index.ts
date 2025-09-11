import './components/world.js';
import './components/paw.js';
import './components/mouse.js';
import './components/smooth-locomotion.js';
import './components/snap-rotate.js';
import './components/shoot.js';
import './components/self-destruct.js';
import './components/head-offset.js';
import './components/particles.js';

import './systems/game.js';
import './systems/coroutine.js';

declare const DEBUG: boolean;
DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
