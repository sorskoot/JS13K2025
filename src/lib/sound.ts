import {jsfxr} from './jsfxr.js';

let audiopool: HTMLAudioElement[] = [];
let pannerNodes: PannerNode[] = [];

// change this so the audio context gets (loaded if not already)
// when the game actually starts.
let audioContext: AudioContext | null = null;

export function InitAudio() {
    //     if (audioContext) return;
    audioContext = new AudioContext();
    //   audioContext.listener.upX.value = 0;
    audioContext.listener.upY.value = 1;
    //  audioContext.listener.upZ.value = 0;
    //audioContext.sampleRate = 11025;
    let gain = audioContext.createGain();
    gain.connect(audioContext.destination);

    for (let i = 0; i < 25; i++) {
        const audio = new Audio();
        audiopool.push(audio);
        const element = audioContext.createMediaElementSource(audio);
        const pn = new PannerNode(audioContext, {
            panningModel: 'HRTF',
            distanceModel: 'exponential',
        });

        element.connect(pn);
        pn.connect(gain);
        pannerNodes.push(pn);
    }
}
let currentSfxIndex = 0;
let soundfx = [
    // prettier-ignore
    jsfxr([1,,0.1272,,0.3603,0.6492,0.2,-0.2783,,,,,,0.7756,-0.6954,,,,1,,,0.2280,,1,
    ]),
    // prettier-ignore
    jsfxr([3, , 0.242, 0.5252, 0.272, 0.0531, , -0.0104, , , , 0.444, 0.7092, , , , 0.09972, -0.2081, 1, , , , , 1]),
    // prettier-ignore
    jsfxr([3, 0.09, 0.67, 0.35, 0.93, 0.2, , -0.12, , , , -0.3774, 0.62, , , , 0.1399, -0.3, 1, , , , , 0.5]),
    // prettier-ignore
    jsfxr([3, , 0.2043, 0.5884, 0.2696, 0.1493, , -0.35, , , , , , , , , , , 1, , , , , 0.5]),
    ,
    ,
    // prettier-ignore
    jsfxr([0, , 0.0343, , 0.2762, 0.533, , -0.4588, , , , , , 0.2202, , , , , 1, , , , , 1]),
    // prettier-ignore
    jsfxr([0, , 0.1957, , 0.1236, 0.5185, , 0.1997, , , , , , 0.2281, , , , , 0.8683, , , , , .5]),
];

export const sound = {
    play: function (sfx: number) {
        if (!audioContext) return;
        audiopool[currentSfxIndex].src = soundfx[sfx]!;
        audiopool[currentSfxIndex].play();
        currentSfxIndex = (currentSfxIndex + 1) % 25;
    },
    /*
      shoot: 0,
      kill: 1,
      gameover: 2,
      block: 3,
      //spawn: 4,
      //upgrade: 5,
      bite: 6
      squick: 7
      */
};
