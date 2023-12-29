export async function fetchVideoData(id: string) {
    const response = await fetch(`https://getube.firegroup.vn/videos/${id}`);
    return  await response.json();
}
