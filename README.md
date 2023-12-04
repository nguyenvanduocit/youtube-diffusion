# Youtube Background Diffusion

Just a quick experiment to replicate the background diffusion effect seen on the YouTube player.

## Development

```bash
bun install
bun run dev
```

## Deploy

Just push to main branch.

## Solution

Use video element to play the video and canvas element to render the video frame by frame, then apply blur filter to the canvas element.

### Todo

- [x] Diffusion effect
- [ ] Make the border of the background fade out
- [ ] Optimize the performance, reduce fps
