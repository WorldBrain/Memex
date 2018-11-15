export type Fetcher = (url) => Promise<any>

// Give in a list of URLs, and it will download the next item, while the program is processing the current one
export class DownloadQueue {
    urls: string[] // What's left to download
    fetched: any[] // What we've downloaded already and are ready to give
    private fetching: Promise<any> // When we're downloading something, listen here for that request to finish
    private fetcher: Fetcher

    constructor({
        urls,
        fetcher = fetch,
    }: {
        urls: string[]
        fetcher: Fetcher
    }) {
        this.urls = urls
        this.fetched = []
        this.fetcher = fetcher
        this.downloadNext()
    }

    async downloadNext() {
        if (this.fetching) {
            return this.fetching
        }

        const url = this.urls.shift()
        this.fetching = this.fetcher(url).then(response => {
            this.fetched.push(response)
            this.fetching = null
            if (this.fetched.length <= 1) {
                this.downloadNext()
            }
            return response
        })
        return this.fetching
    }

    async getNext() {
        if (!this.hasNext()) {
            return null
        }

        let next
        if (this.fetched.length) {
            next = this.fetched.shift()
            this.downloadNext()
        } else {
            next = this.downloadNext()
        }

        return next
    }

    hasNext() {
        return !!this.urls.length || this.fetched.length
    }
}
