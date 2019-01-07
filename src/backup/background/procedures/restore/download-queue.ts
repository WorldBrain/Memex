export type Fetcher = (url) => Promise<any>

// Give in a list of URLs, and it will download the next item, while the program is processing the current one
export class DownloadQueue {
    private items: any[] // What's left to download
    private downloads: Array<Promise<any>> = [] // When we're downloading something, listen here for that request to finish
    private fetcher: Fetcher
    private consumed = 0
    private concurrency: number

    constructor({
        items,
        fetcher = fetch,
        concurrency = 1,
    }: {
        items: any[]
        fetcher: Fetcher
        concurrency?: number
    }) {
        this.items = items
        this.fetcher = fetcher
        this.concurrency = concurrency
        this.queueNext()
    }

    get hasFreeDownloadSlots() {
        const slotsInUse = this.downloads.reduce(
            (sum, download) => (sum += download != null ? 1 : 0),
            0,
        )

        return slotsInUse < this.concurrency
    }

    async downloadNext() {
        const item = this.items.shift()
        const response = await this.fetcher(item)
        this.queueNext()
        return response
    }

    queueNext() {
        if (this.items.length && this.hasFreeDownloadSlots) {
            const index = this.downloads.length
            this.downloads.push(
                this.downloadNext().then(response => {
                    return () => {
                        this.downloads[index] = null
                        this.queueNext()
                        return response
                    }
                }),
            )
        }
    }

    async getNext() {
        if (!this.hasNext()) {
            return null
        }

        this.queueNext()
        const nextDownload = this.downloads[this.consumed++]
        return nextDownload.then(getResponse => getResponse())
    }

    hasNext() {
        return (
            !!this.items.length ||
            (!!this.downloads.length &&
                !!this.downloads[this.downloads.length - 1])
        )
    }
}
