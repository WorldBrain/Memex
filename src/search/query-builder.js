import transform from 'src/util/transform-page-text'
import { DEFAULT_TERM_SEPARATOR } from './search-index'

// Pattern to match entire string to `domain.tld`-like format + optional ccTLD
const DOMAIN_TLD_PATTERN = /^\w{2,}\.\w{2,3}(\.\w{2})?$/

class QueryBuilder {
    skip = 0
    limit = 10
    query = new Set()
    timeFilter = new Map()
    domain = new Set()
    isBadTerm = false

    get = () => ({
        query: this.query,
        limit: this.limit,
        skip: this.skip,
        domain: this.domain,
        isBadTerm: this.isBadTerm,
        timeFilter: this.timeFilter,
    });

    skipUntil(skip) {
        this.skip = skip
        return this
    }

    limitUntil(limit) {
        this.limit = limit
        return this
    }

    filterTime({ startDate, endDate }, keyType) {
        if (!startDate && !endDate) {
            this.timeFilter.set('blank', true)
        }

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

        // Remove any domains detected in search terms, place them into domains Set
        terms = terms.reduce((acc, term) => {
            if (DOMAIN_TLD_PATTERN.test(term)) {
                this.domain.add(term)
                return acc
            }
            return [...acc, term]
        }, [])

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
                    this.query.add(term)
                } else {
                    this.isBadTerm = true
                }
            })

            this.isBadTerm = goodTerm === 0
        }

        return this
    }
}

export default QueryBuilder
