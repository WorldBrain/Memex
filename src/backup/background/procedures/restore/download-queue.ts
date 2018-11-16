export type Fetcher = (url) => Promise<any>

// Give in a list of URLs, and it will download the next item, while the program is processing the current one
export class DownloadQueue {
    items: any[] // What's left to download
    fetched: any[] // What we've downloaded already and are ready to give
    private fetching: Promise<any> // When we're downloading something, listen here for that request to finish
    private fetcher: Fetcher

    constructor({
        items,
        fetcher = fetch,
    }: {
        items: any[]
        fetcher: Fetcher
    }) {
        this.items = items
        this.fetched = []
        this.fetcher = fetcher
        this.fetching = this.downloadNext()
    }

    async downloadNext() {
        if (this.fetching) {
            return this.fetching
        }
        if (!this.items.length) {
            return null
        }

        // Make sure things are appended in-order by pre-allocating in array
        const index = this.fetched.length
        this.fetched.push(null)
        const item = this.items.shift()

        const response = await this.fetcher(item)
        this.fetched[index] = response
        this.fetching = null
        if (this.fetched.length <= 1) {
            this.fetching = this.downloadNext()
        }
        return response
    }

    async getNext() {
        if (!this.hasNext()) {
            return null
        }

        let next
        if (this.fetched.length && this.fetched[0]) {
            next = this.fetched.shift()
            this.fetching = this.downloadNext()
        } else {
            this.fetching = next = this.downloadNext().then(response => {
                this.fetched.shift()
                return response
            })
        }

        return next
    }

    hasNext() {
        return !!this.items.length || this.fetched.length
    }
}
