import transformPageText from 'src/util/transform-page-text'
import { DEFAULT_TERM_SEPARATOR } from './search-index'

/**
 * @typedef IndexQuery
 * @type {Object}
 * @property {Set<string>} query Query terms a user has searched for.
 * @property {Set<string>} domain Set of domains a user has chosen to filter, or extracted from query.
 * @property {Set<string>} tags Set of tags a user has chosen to filter, or extracted from query.
 * @property {Map<string, any>} timeFilter Map of different time filter ranges to apply to search.
 * @property {number} [skip=0]
 * @property {number} [limit=10]
 * @property {boolean} [isBadTerm=false] Flag denoting whether or not searched query is not specific enough.
 */

class QueryBuilder {
    // Pattern to match entire string to `domain.tld`-like format + optional subdomain prefix and ccTLD postfix
    static DOMAIN_TLD_PATTERN = /^(\w+\.)?[\w-]{2,}\.\w{2,3}(\.\w{2})?$/

    // Pattern to match hashtags - spaces can be represented via '+'
    static HASH_TAG_PATTERN = /^#\w[\w+]*$/

    /**
     * Slice off '#' prefix and replace any '+' with space char
     *
     * @param {string} tag
     * @return {string}
     */
    static stripTagPattern = tag =>
        tag
            .slice(1)
            .split('+')
            .join(' ')

    /**
     * Splits up an input string into terms.
     *
     * @param {string} input
     * @param {string|RegExp} [delim]
     * @return {string[]}
     */
    static getTermsFromInput = (input, delim = DEFAULT_TERM_SEPARATOR) =>
        input
            .toLowerCase()
            .trim()
            .split(delim)

    skip = 0
    limit = 10
    query = new Set()
    timeFilter = new Map()
    domain = new Set()
    tags = new Set()
    isBadTerm = false
    showOnlyBookmarks = false

    /**
     * @returns {IndexQuery}
     * @memberof QueryBuilder
     */
    get = () => ({
        query: this.query,
        limit: this.limit,
        skip: this.skip,
        domain: this.domain,
        tags: this.tags,
        isBadTerm: this.isBadTerm,
        timeFilter: this.timeFilter,
        bookmarksFilter: this.showOnlyBookmarks,
    });

    skipUntil(skip) {
        this.skip = skip
        return this
    }

    limitUntil(limit) {
        this.limit = limit
        return this
    }

    bookmarksFilter(showOnlyBookmarks) {
        this.showOnlyBookmarks = showOnlyBookmarks
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

    _filterGen = stateSet => data => {
        data.forEach(datum => stateSet.add(datum))
        return this
    }

    filterDomains = this._filterGen(this.domain)
    filterTags = this._filterGen(this.tags)

    /**
     * Filter out terms those terms that match any tags/domain pattern from an array of terms.
     * Contains side-effects to update `domains` and `tags` Sets with anything found.
     */
    _extractTermsPatterns = (termsArr = []) =>
        termsArr.filter(term => {
            if (QueryBuilder.DOMAIN_TLD_PATTERN.test(term)) {
                this.domain.add(term)
                return false
            }

            if (QueryBuilder.HASH_TAG_PATTERN.test(term)) {
                this.tags.add(QueryBuilder.stripTagPattern(term))
                return false
            }

            return true
        })

    searchTerm(input = '') {
        // Short-circuit if blank search
        if (!input.trim().length) {
            return this
        }

        // STAGE 1: Filter out tags/domains
        const terms = QueryBuilder.getTermsFromInput(input, /\s+/)
        const filteredTerms = this._extractTermsPatterns(terms)

        // Short-circuit if all terms filtered out as tags/domains
        if (!filteredTerms.length) {
            return this
        }

        // STAGE 2: push through index text-processing logic
        const { text } = transformPageText({ text: filteredTerms.join(' ') })

        // Search is too vague if nothing left from text-processing
        if (!text.trim().length) {
            this.isBadTerm = true
            return this
        }

        // Add post-processed terms to `query` Set
        QueryBuilder.getTermsFromInput(text).forEach(term =>
            this.query.add(term),
        )

        return this
    }
}

export default QueryBuilder
