import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'

export async function fetchYoutubeTranscript(
    videoId: string,
    getRawTranscript?: boolean,
) {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'

    const baseUrl = isStaging
        ? CLOUDFLARE_WORKER_URLS.staging
        : CLOUDFLARE_WORKER_URLS.production

    const normalisedYoutubeURL = 'https://www.youtube.com/watch?v=' + videoId

    const response = await fetch(baseUrl + '/youtube-transcripts', {
        method: 'POST',
        body: JSON.stringify({
            originalUrl: normalisedYoutubeURL,
            getRawTranscript: getRawTranscript ?? false,
        }),
        headers: { 'Content-Type': 'application/json' },
    })

    let responseOutput = null

    if (getRawTranscript) {
        responseOutput = await response.json()
    } else {
        responseOutput = await response.text()
    }

    return responseOutput
}
