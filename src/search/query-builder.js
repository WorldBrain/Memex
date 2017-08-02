
class QueryBuilder {
    constructor() {
        this.content = []
        this.timestamp = []
        this.offset = null;
        this.pageSize = null;
    }

    _setDate = field => time => {
        const current = this.timestamp.length ? this.timestamp[0] : {}
        const updated = [{ ...current, [field]: String(time) }]

        // Search index needs defaults if they're missing
        if (!updated[0].gte) updated[0].gte = '0'
        if (!updated[0].lte) updated[0].lte = String(Date.now())

        this.timestamp = updated
        return this
    }

    get = () => {
        const query = {
            query: {
                AND: { content: this.content, timestamp: this.timestamp },
            },
        }

        if (this.offset) query.offset = this.offset
        if (this.pageSize) query.pageSize = this.pageSize

        return query
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
