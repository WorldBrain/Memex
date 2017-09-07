import stopword from 'stopword'

// Pattern to match entire string to `domain.tld`-like format
const DOMAIN_TLD_PATTERN = /^\w{2,}\.\w{2,3}$/

class QueryBuilder {
    constructor() {
        this.content = []
        this.bookmarks = []
        this.visits = []
        this.offset = null
        this.pageSize = null
        this.url = []
    }

    /**
     * Sets up the query on time-based fields. Currently mirrors for both, as
     * our current search does not differentiate between visits and bookmarks.
     */
    _setDate = op => time => {
        // Don't add anything if the time isn't given
        if (!time) { return this }
        const currentBookmarks = this.bookmarks.length ? this.bookmarks[0] : {}
        const currentVisits = this.visits.length ? this.visits[0] : {}
        const updatedBookmarks = [{ ...currentBookmarks, [op]: `bookmark/${time}` }]
        const updatedVisits = [{ ...currentVisits, [op]: `visit/${time}` }]

        // search-index needs defaults if they're missing
        if (!updatedBookmarks[0].gte) updatedBookmarks[0].gte = 'bookmark/'
        if (!updatedBookmarks[0].lte) updatedBookmarks[0].lte = `bookmark/${Date.now()}`
        if (!updatedVisits[0].gte) updatedVisits[0].gte = 'visit/'
        if (!updatedVisits[0].lte) updatedVisits[0].lte = `visit/${Date.now()}`

        // Set updated query fields
        this.bookmarks = updatedBookmarks
        this.visits = updatedVisits
        return this
    }

    startDate = this._setDate('gte')
    endDate = this._setDate('lte')

    get() {
        const q = {
            query: [
                { AND: { content: this.content, bookmarks: this.bookmarks, url: this.url } },
                { AND: { content: this.content, visits: this.visits, url: this.url } },
            ],
        }

        if (this.offset) q.offset = this.offset
        if (this.pageSize) q.pageSize = this.pageSize

        return q
    }

    skipUntil(skip) {
        this.offset = skip
        return this
    }

    limit(limit) {
        this.pageSize = limit
        return this
    }

    searchTerm(input) {
        if (input) {
            // All indexed strings are lower-cased, so force the query terms to be
            let terms = input
                .toLowerCase()
                .match(/\S+/g) || []

            // All EN stopwords are unindexed, so remove any from query terms
            terms = stopword.removeStopwords(terms, stopword.en)

            // Split into words and push to query
            terms.forEach(term => {
                if (DOMAIN_TLD_PATTERN.test(term)) {
                    // Only can support single domain.tld search for now, so set to first index
                    this.url[0] = term
                } else {
                    this.content.push(term)
                }
            })
        }
        return this
    }
}

export default QueryBuilder
