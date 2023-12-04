import './style/modern-normalize.css'
import './style/app.styl'


const videoEl = document.querySelector<HTMLVideoElement>('#video')!
const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas')!

const ctx = canvasEl.getContext('2d')!;
ctx.filter = 'blur(20px)';

function drawFrame() {
    ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
    requestAnimationFrame(drawFrame);
}

drawFrame();

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
});

videoEl.play().catch(() => {
    playButton.style.display = 'inline-block';

    // try to play again
    setTimeout(() => {
        videoEl.play()
    }, 500)
});
