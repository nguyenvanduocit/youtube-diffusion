/// <reference types="vite/client" />

declare type VideoData = {
    thumbnail: string
    title: string
    id: string
}


declare type FetchPlaylistResponse = {
    videos: VideoData[]
}
