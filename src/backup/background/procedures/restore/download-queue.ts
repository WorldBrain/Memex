export type Fetcher = (url) => Promise<any>

// Give in a list of URLs, and it will download the next item, while the program is processing the current one
export class DownloadQueue {
    private items: any[] // What's left to download
    private downloads: Array<Promise<any>> = [] // When we're downloading something, listen here for that request to finish
    private fetcher: Fetcher
    private consumed = 0

    constructor({
        items,
        fetcher = fetch,
    }: {
        items: any[]
        fetcher: Fetcher
    }) {
        this.items = items
        this.fetcher = fetcher
        this.queueNext()
    }

    async downloadNext() {
        const item = this.items.shift()
        const response = await this.fetcher(item)
        this.queueNext()
        return response
    }

    queueNext() {
        if (this.items.length && this.downloads.length <= 1) {
            const index = this.downloads.length
            this.downloads.push(
                this.downloadNext().then(response => {
                    return () => {
                        this.downloads[index] = null
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
