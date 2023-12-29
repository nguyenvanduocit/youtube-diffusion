import './style/modern-normalize.css'
import './style/app.styl'
import {requestAnimationFrameWithFps, stopAnimationFrame} from "./fns/requestAnimationFrameWithFps";


const videoEl = document.querySelector<HTMLVideoElement>('#video')!
const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!
let analyser: AnalyserNode | null = null;

const ctx = canvasEl.getContext('2d')!
ctx.filter = 'blur(20px)'

const url = new URL(window.location.href)
let id = url.searchParams.get('id')
if (!id) {
    id = 'A662aiCky-c'
}

fetch(`https://getube.firegroup.vn/videos/${id}`).then(async response => {
    const videoData = await response.json()

    //set cover
    const coverUrl = videoData.thumbnail
    const cover = new Image()
    cover.src = coverUrl
    cover.onload = () => {
        ctx.drawImage(cover, 0, 0, canvasEl.width, canvasEl.height)
    }

    videoEl.src = 'https://getube.fly.dev/stream/' + id

    requestAnimationFrameWithFps('draw-frame', drawFrame, 30)
})


function drawFrame() {
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height)
}

const initAnalyser = () => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(videoEl)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    source.connect(analyser)
    analyser.connect(audioContext.destination)

    const lowPassFilter = audioContext.createBiquadFilter()
    lowPassFilter.type = 'lowpass'
    lowPassFilter.frequency.value = 150

    source.connect(lowPassFilter)
    lowPassFilter.connect(analyser)
}

const processScaleEffect = () => {
    if (!analyser && !videoEl.paused) {
        initAnalyser()
    }

    if (!analyser) {
        return
    }

    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(data)

    const bass = data.reduce((a, b) => a + b) / data.length
    // avg is a number between 0 and 255, so we normalize it to be between 0 and 1 with a sensitivity factor
    const sensitivity = 0.5
    const normalized = bass / (255 * sensitivity)

    // scale
    const minScale = 0.7
    const maxScale = 1.5
    const scaled = minScale + normalized * (maxScale - minScale)
    let transform = `scale(${scaled})`

    const bassThreshold = 0.98
    if (normalized > bassThreshold) {
        // random shift
        const shiftX = (Math.random() - 0.5) * 2 * 5
        const shiftY = (Math.random() - 0.5) * 2 * 5
        transform += ` translate(${shiftX}px, ${shiftY}px)`
    }

    videoEl.style.transform = transform


    // brightness
    const minBrightness = 0.1
    const maxBrightness = 1.8
    const brightness = minBrightness + normalized * (maxBrightness - minBrightness)

    ctx.filter = `brightness(${brightness}) blur(20px)`
    videoEl.style.filter = `brightness(${1 + normalized * 0.5})`
}

const controlPanelEl = document.querySelector<HTMLDivElement>('#controlPanel')!
const playButton = document.querySelector<HTMLButtonElement>('#play-button')!
playButton.addEventListener('click', () => {
    videoEl.play()
});

videoEl.addEventListener('play', () => {
    controlPanelEl.style.display = 'none'
    requestAnimationFrameWithFps('process-scale-effect', processScaleEffect, 30)
});

videoEl.addEventListener('pause', () => {
    controlPanelEl.style.display = 'inline-block'
    stopAnimationFrame('process-scale-effect')
});

let hasUserInteracted = false

function attemptAutoplay() {
    if (!hasUserInteracted && videoEl.paused) {
        videoEl.play().catch(() => {
            playButton.style.display = 'inline-block'
        })
        hasUserInteracted = true
    }
}

document.addEventListener('keydown', attemptAutoplay)
document.addEventListener('click', attemptAutoplay)
