import './style/modern-normalize.css'
import './style/app.styl'
import {requestAnimationFrameWithFps, stopAnimationFrame} from "./fns/requestAnimationFrameWithFps";


const videoEl = document.querySelector<HTMLVideoElement>('#video')!
const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!
let analyser: AnalyserNode | null = null;

const ctx = canvasEl.getContext('2d')!;
ctx.filter = 'blur(20px)';


function drawFrame() {
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
}

requestAnimationFrameWithFps('draw-frame', drawFrame, 30);

const initAnalyser = () => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(videoEl);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 150;

    source.connect(lowPassFilter);
    lowPassFilter.connect(analyser);
}

const processScaleEffect = () => {
    if (!analyser && !videoEl.paused) {
        initAnalyser();
    }

    if (!analyser) {
        return;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a+b) / data.length;
    // avg is a number between 0 and 255, so we normalize it to be between 0 and 1 with a sensitivity factor
    const sensitivity = 0.5;
    const normalized = avg / (255 * sensitivity);
    const minScale = 0.7;
    const maxScale = 0.5; // +1

    const scaled = minScale + normalized * maxScale;
    videoEl.style.transform = `scale(${scaled})`;

}


const themeToggleButton = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
themeToggleButton.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark-theme');
});

const sizeToggleButton = document.querySelector<HTMLButtonElement>('#size-toggle')!;
sizeToggleButton.addEventListener('click', () => {
    canvasEl.classList.toggle('full');
});

const blurSlider = document.querySelector<HTMLInputElement>('#blur-slider')!;
blurSlider.addEventListener('input', () => {
    const blurValue = blurSlider.value;
    ctx.filter = `blur(${blurValue}px)`;
});

const playButton = document.querySelector<HTMLButtonElement>('#play-button')!;
playButton.addEventListener('click', () => {
    videoEl.play();
});

videoEl.addEventListener('play', () => {
    playButton.style.display = 'none';
    requestAnimationFrameWithFps('process-scale-effect', processScaleEffect, 30);
});

videoEl.addEventListener('pause', () => {
    playButton.style.display = 'inline-block';
    stopAnimationFrame('process-scale-effect');
});

let hasUserInteracted = false;

function attemptAutoplay() {
    if (!hasUserInteracted && videoEl.paused) {
        videoEl.play().catch(() => {
            playButton.style.display = 'inline-block';
        });
        hasUserInteracted = true;
    }
}

document.addEventListener('keydown', attemptAutoplay);
document.addEventListener('click', attemptAutoplay);
