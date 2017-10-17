import { DEFAULT_TERM_SEPARATOR } from './search-index'
import transform from '../util/transform-page-text'

// Pattern to match entire string to `domain.tld`-like format + optional ccTLD
const DOMAIN_TLD_PATTERN = /^\w{2,}\.\w{2,3}(\.\w{2})?$/

class QueryBuilder {
    skip = 0
    limit = 10
    query = new Set()
    timeFilter = new Map()
    domain
    isBadTerm = false

    get() {
        return {
            query: this.query,
            limit: this.limit,
            skip: this.skip,
            domain: this.domain,
            isBadTerm: this.isBadTerm,
            timeFilter: this.timeFilter,
        }
    }

    skipUntil(skip) {
        this.skip = skip
        return this
    }

    limitUntil(limit) {
        this.limit = limit
        return this
    }

    filterTime({ startDate, endDate }, keyType) {
        const existing = this.timeFilter.get(keyType) || {}
        this.timeFilter.set(keyType, {
            ...existing,
            gte: startDate ? `${keyType}${startDate}` : keyType,
            lte: endDate ? `${keyType}${endDate}` : `${keyType}\uffff`,
        })

        return this
    }

    searchTerm(input = '') {
        // All indexed strings are lower-cased, so force the query terms to be
        let terms = input.toLowerCase().match(/\S+/g) || []

        // All terms must be pushed to the text-pipeline to take into account stopword removal ect...
        terms = transform({ text: terms.join(' '), lang: 'all' })

        // Make sure terms is defined before trying to turn back into array.
        if (terms) {
            terms = terms.text.split(DEFAULT_TERM_SEPARATOR)
        }

        // If there are valid search terms, parse them...
        if (terms && terms.length) {
            // Split into words and push to query
            let goodTerm = 0
            terms.forEach(term => {
                if (term !== '') {
                    goodTerm += 1
                    if (DOMAIN_TLD_PATTERN.test(term)) {
                        this.domain = term
                    } else {
                        this.query.add(term)
                    }
                }
            })
            if (goodTerm === 0) {
                this.isBadTerm = true
            }
        }

        return this
    }
}

export default QueryBuilder
