import type {Component} from 'aframe';
import type {DataOf} from '../lib/aframe-utils.js';
import {Mesh, Vector3} from 'three';

const schema = {
    // example: myProp: { type: 'number', default: 0 },
} as const;

type ParticlesData = DataOf<typeof schema>;
type ParticlesComponent = Component<ParticlesData> & {
    // Add custom properties/methods here
    particles: Particle[];
};
const rand = (min: number, max: number) => min + Math.random() * (max - min);
type Particle = Mesh & {
    velocity?: Vector3;
    acceleration?: Vector3;
};

AFRAME.registerComponent('particles', {
    schema,
    init: function (this: ParticlesComponent) {
        const particles = new THREE.Group();
        const geo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        const mat = new THREE.MeshLambertMaterial({color: 'red'});
        this.particles = [];
        for (let i = 0; i < 25; i++) {
            const particle = new THREE.Mesh(geo, mat) as Particle;
            particle.velocity = new THREE.Vector3(rand(-0.03, 0.03), rand(0.001, 0.05), rand(-0.03, 0.03));
            particle.acceleration = new THREE.Vector3(0, -0.003, 0);
            particles.add(particle);
            this.particles.push(particle);
        }
        this.el.object3D.add(particles);
        this.el.setAttribute('self-destruct', {timer: 500});
    },
    tick: function (this: ParticlesComponent, time: number, timeDelta: number) {
        for (const particle of this.particles) {
            if (particle.velocity && particle.acceleration) {
                particle.velocity.add(particle.acceleration);
                particle.position.add(particle.velocity);
            }
        }
    },
});
