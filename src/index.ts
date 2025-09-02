import './components/world.js';
import './components/paw.js';
import './components/mouse.js';
import {smoothLocomotionComponent} from './components/smooth-locomotion.js';

AFRAME.registerComponent('smooth-locomotion', smoothLocomotionComponent);

declare const DEBUG: boolean;
DEBUG && new EventSource('/esbuild').addEventListener('change', () => location.reload());
