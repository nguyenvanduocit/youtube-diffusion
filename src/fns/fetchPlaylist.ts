
export async function fetchPlaylist(id: string): Promise<FetchPlaylistResponse> {
    const response = await fetch(`https://getube.firegroup.vn/playlists/${id}`);
    const data = await response.json()

    return data as FetchPlaylistResponse
}
