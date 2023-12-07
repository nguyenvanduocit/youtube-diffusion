const animationFrames = new Map<string, number>();
const lastUpdateTime = new Map<string, number>();

export const requestAnimationFrameWithFps = (id: string, callback: () => void, fps: number) => {
    if (animationFrames.has(id)) {
        console.warn(`Animation frame with id ${id} already exists.`);
        return;
    }

    const frameDelay = 1000 / fps;

    function frame(timestamp: number) {
        if (!animationFrames.has(id)) {
            return;
        }

        if (!lastUpdateTime.has(id) || timestamp - lastUpdateTime.get(id)! >= frameDelay) {
            lastUpdateTime.set(id, timestamp);
            callback();
        }

        animationFrames.set(id, requestAnimationFrame(frame));
    }

    animationFrames.set(id, requestAnimationFrame(frame));
}

export const stopAnimationFrame = (id: string) => {
    if (!animationFrames.has(id)) {
        console.warn(`No animation frame with id ${id} exists.`);
        return;
    }

    cancelAnimationFrame(animationFrames.get(id)!);
    animationFrames.delete(id);
    lastUpdateTime.delete(id);
}
