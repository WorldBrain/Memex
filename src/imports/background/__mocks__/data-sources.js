import chunk from 'lodash/fp/chunk'

export default class DataSources {
    constructor({ bookmarks = [], history = [], chunkSize = 10 }) {
        this._bookmarks = bookmarks
        this._history = history
        this._chunk = chunk(chunkSize)
    }

    async *bookmarks() {
        for (const itemChunk of this._chunk(this._bookmarks)) {
            yield itemChunk
        }
    }

    async *history() {
        for (const itemChunk of this._chunk(this._history)) {
            yield itemChunk
        }
    }
}
