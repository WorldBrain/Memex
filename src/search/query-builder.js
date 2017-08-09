
class QueryBuilder {
    constructor() {
        this.content = []
        this.bookmarkTimestamps = []
        this.visitTimestamps = []
        this.offset = null
        this.pageSize = null
    }

    /**
     * Sets up the query on time-based fields. Currently mirrors for both, as
     * our current search does not differentiate between visits and bookmarks.
     */
    _setDate = op => time => {
        // Don't add anything if the time isn't given
        if (!time) { return this }
        const currentBookmarks = this.bookmarkTimestamps.length ? this.bookmarkTimestamps[0] : {}
        const currentVisits = this.visitTimestamps.length ? this.visitTimestamps[0] : {}
        const updatedBookmarks = [{ ...currentBookmarks, [op]: `bookmark/${time}` }]
        const updatedVisits = [{ ...currentVisits, [op]: `visit/${time}` }]

        // search-index needs defaults if they're missing
        if (!updatedBookmarks[0].gte) updatedBookmarks[0].gte = 'bookmark/'
        if (!updatedBookmarks[0].lte) updatedBookmarks[0].lte = `bookmark/${Date.now()}`
        if (!updatedVisits[0].gte) updatedVisits[0].gte = 'visit/'
        if (!updatedVisits[0].lte) updatedVisits[0].lte = `visit/${Date.now()}`

        // Set updated query fields
        this.bookmarkTimestamps = updatedBookmarks
        this.visitTimestamps = updatedVisits
        return this
    }

    get = () => {
        const q = {
            query: [
                { AND: { content: this.content, bookmarkTimestamps: this.bookmarkTimestamps } },
                { AND: { content: this.content, visitTimestamps: this.visitTimestamps } },
            ],
        }

        if (this.offset) q.offset = this.offset
        if (this.pageSize) q.pageSize = this.pageSize

        return q
    }

    skipUntil = skip => {
        this.offset = skip
        return this
    }

    limit = limit => {
        this.pageSize = limit
        return this
    }

    searchTerm = term => {
        if (term) this.content.push(term)
        return this
    }

    startDate = this._setDate('gte')
    endDate = this._setDate('lte')
}

export default QueryBuilder
