import { fetchDOMFromUrl } from 'src/page-analysis/background/fetch-page-data'
import Readability from 'readability/Readability'
import JSDOMParser from 'readability/JSDOMParser'

describe('Reader tests', () => {
    it('parses correctly', async () => {
        const fullUrl =
            'https://www.theguardian.com/film/gallery/2020/may/07/windowflick-berlin-screenings-in-pictures'
        console.log(`Fetching ${fullUrl}`)
        const fullDoc = await fetchDOMFromUrl(fullUrl, 5000).run()
        const read = new Readability(fullDoc)
        const readable = read.parse()
        console.dir(readable)
    })
})
