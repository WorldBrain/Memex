import { extractIdFromUrl, isUrlYTVideo } from './youtube-url'

interface TestCase {
    id?: string
    url: string
    isYTVideo: boolean
}

const TEST_CASES: TestCase[] = [
    {
        url:
            'http://www.youtube.com/watch?v=vJG698U2Mvo&feature=feedrec_grec_index',
        isYTVideo: true,
        id: 'vJG698U2Mvo',
    },
    {
        url: 'http://www.youtube.com/watch?v=vJG698U2Mvo#t=0m10s',
        isYTVideo: true,
        id: 'vJG698U2Mvo',
    },
    {
        url:
            'https://www.youtube.com/v/vJG698U2Mvo?fs=1&amp;hl=en_US&amp;rel=0',
        isYTVideo: true,
        id: 'vJG698U2Mvo',
    },
    {
        url: 'http://www.youtube.com/embed/vJG698U2Mvo?rel=0',
        isYTVideo: true,
        id: 'vJG698U2Mvo',
    },
    {
        url: 'http://www.youtube.com/watch?v=vJG698U2Mvo',
        isYTVideo: true,
        id: 'vJG698U2Mvo',
    },
    { url: 'http://youtu.be/vJG698U2Mvo', isYTVideo: true, id: 'vJG698U2Mvo' },
    { url: 'http://google.com', isYTVideo: false },
    { url: 'http://youtube.com', isYTVideo: false },
    { url: 'http://youtube.com/feed/subscriptions', isYTVideo: false },
]

describe('YouTube URL util fns', () => {
    it('should be able to extract video IDs from videos', () => {
        for (const { url, isYTVideo, id } of TEST_CASES) {
            if (!isYTVideo) {
                continue
            }

            expect({ url, id: extractIdFromUrl(url) }).toEqual({ url, id })
        }
    })

    it('should be able to detect URL is a YouTube video', () => {
        for (const { url, isYTVideo } of TEST_CASES) {
            expect({ url, isYTVideo: isUrlYTVideo(url) }).toEqual({
                url,
                isYTVideo,
            })
        }
    })
})
