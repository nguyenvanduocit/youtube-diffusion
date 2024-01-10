import './style/modern-normalize.css'
import './style/app.styl'
import {requestAnimationFrameWithFps, stopAnimationFrame} from "./fns/requestAnimationFrameWithFps";
import {fetchVideoData} from "./fns/fetchVideoData";
import {fetchPlaylist} from "./fns/fetchPlaylist";


const videoEl = document.querySelector<HTMLVideoElement>('#video')!
const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!
let analyser: AnalyserNode | null = null;


const ctx = canvasEl.getContext('2d')!
ctx.filter = 'blur(20px)'

const url = new URL(window.location.href)

let videoPadding = url.searchParams.get('video-padding')
if (videoPadding) {
    document.documentElement.style.setProperty('--video-padding', videoPadding + '%');
}

let ids = url.searchParams.get('ids')

let idArray = ids?.split(',') || []

let playlistId = url.searchParams.get('playlist-id')
if (playlistId) {
    const fetchPlaylistResponse = await fetchPlaylist(playlistId)
    for (const video of fetchPlaylistResponse.videos) {
        idArray.push(video.id)
    }
}


let currentVideoIndex = 0;

// Function to set video source and cover
function setVideoSourceAndCover(videoData: VideoData, id: string) {
    // set cover for the video
    const coverUrl = videoData.thumbnail
    const cover = new Image()
    cover.src = coverUrl
    cover.onload = () => {
        ctx.drawImage(cover, 0, 0, canvasEl.width, canvasEl.height)
    }

    videoEl.src = 'https://getube.firegroup.vn/stream/' + id
    requestAnimationFrameWithFps('draw-frame', drawFrame, 30)
}


// Start by fetching the first video
fetchVideoData(idArray[currentVideoIndex]).then(videoData => {
    setVideoSourceAndCover(videoData, idArray[currentVideoIndex]);
});

videoEl.addEventListener('ended', () => {
    currentVideoIndex++;
    if (currentVideoIndex === idArray.length) {
        currentVideoIndex = 0;
    }

    fetchVideoData(idArray[currentVideoIndex]).then(videoData => {
        setVideoSourceAndCover(videoData, idArray[currentVideoIndex]);
        videoEl.play();
    });
});


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
    const maxScale = 1.2
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
    //videoEl.style.filter = `brightness(${1 + normalized * 0.5})`
}

const toggleButtonEl = document.querySelector<HTMLButtonElement>('#toggleButton')!
toggleButtonEl.addEventListener('click', () => {
    attemptToPlay()
});

videoEl.addEventListener('play', () => {
    requestAnimationFrameWithFps('process-scale-effect', processScaleEffect, 30)
});

videoEl.addEventListener('pause', () => {
    stopAnimationFrame('process-scale-effect')
});

videoEl.addEventListener('timeupdate', () => {
    let percent = 0;
    if (videoEl.duration) {
        percent = videoEl.currentTime / videoEl.duration * 100;
    }
    document.documentElement.style.setProperty('--video-progress', percent + '%');
});

function adjustCanvasSize() {
    // Get the width and height of the window
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate the aspect ratio of the window
    const windowAspectRatio = windowWidth / windowHeight;

    // The aspect ratio of the video is 16:9
    const videoAspectRatio = 16 / 9;

    if (windowAspectRatio > videoAspectRatio) {
        // If the window is wider than the video, set the width of the canvas to the width of the window and adjust the height to maintain the aspect ratio
        canvasEl.style.width = windowWidth + 'px';
        canvasEl.style.height = (windowWidth / videoAspectRatio) + 'px';
    } else {
        // If the window is taller than the video, set the height of the canvas to the height of the window and adjust the width to maintain the aspect ratio
        canvasEl.style.height = windowHeight + 'px';
        canvasEl.style.width = (windowHeight * videoAspectRatio) + 'px';
    }
}

// Adjust the size of the canvas when the window is resized
window.addEventListener('resize', adjustCanvasSize);
adjustCanvasSize()

function attemptToPlay() {
    if (videoEl.paused) {
        videoEl.play()
        toggleButtonEl.textContent = 'Pause'
    } else {
        videoEl.pause()
        toggleButtonEl.textContent = 'Play'
    }
}
