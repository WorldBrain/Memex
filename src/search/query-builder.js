import { HASH_TAG_PATTERN } from '@worldbrain/memex-common/lib/storage/constants'

import transformPageText from 'src/util/transform-page-text'
import * as constants from '../overview/search-bar/constants'
import { splitInputIntoTerms } from '../overview/search-bar/utils'
import { DEFAULT_TERM_SEPARATOR } from './util'

class QueryBuilder {
    /**
     * Pattern to match entire string to `domain.tld`-like format + optional subdomain prefix and ccTLD postfix.
     */
    static DOMAIN_TLD_PATTERN = constants.DOMAIN_TLD_PATTERN

    /**
     * Pattern to match hashtags - spaces can be represented via '+'.
     */
    static HASH_TAG_PATTERN = HASH_TAG_PATTERN

    /**
     * Matches a given excluded domain or term query term. Hyphen must be before some word/s.
     */
    static EXCLUDE_PATTERN = constants.EXCLUDE_PATTERN

    /**
     * Used to match against some optional leading syntax like 'site:' and '-'
     */
    static TERM_CLEAN_PATTERN = constants.TERM_CLEAN_PATTERN

    /**
     * Slice off '#' prefix and replace any '+' with space char
     *
     * @param {string} tag
     * @return {string}
     */
    static stripTagPattern = (tag) => tag.slice(1).split('+').join(' ')

    /**
     * Splits up an input string into terms.
     *
     * @param {string} input
     * @param {string|RegExp} [delim]
     * @return {string[]}
     */
    static getTermsFromInput = (input, delim = DEFAULT_TERM_SEPARATOR) =>
        input.toLowerCase().trim().split(delim)

    skip = 0
    limit = 10
    query = new Set()
    queryExclude = new Set()
    timeFilter = new Map()
    domain = new Set()
    domainExclude = new Set()
    tags = new Set()
    lists = new Set()
    isBadTerm = false
    showOnlyBookmarks = false

    get() {
        return {
            terms: [...this.query],
            termsExclude: [...this.queryExclude],
            domains: [...this.domain],
            domainsExclude: [...this.domainExclude],
            tags: [...this.tags],
            lists: [...this.lists],
            isBadTerm: this.isBadTerm,
            // Can't do a terms exclusion without some terms already defined
            isInvalidSearch: this.queryExclude.size && !this.query.size,
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

    _filterGen = (filterName) => (dataToAdd = []) => {
        for (const data of dataToAdd) {
            this[filterName].add(data)
        }

        return this
    }

    filterTags = this._filterGen('tags')
    filterDomains = this._filterGen('domain')
    filterExcDomains = this._filterGen('domainExclude')
    filterLists = this._filterGen('lists')

    /**
     * Filter out terms those terms that match any tags/domain pattern from an array of terms.
     * Contains side-effects to update `domains` and `tags` Sets with anything found.
     */
    _extractTermsPatterns(termsArr = []) {
        const terms = { exclude: [], include: [] }

        for (let term of termsArr) {
            // Edge-case; can't seem to remove in the `.split` delimiter pattern
            if (term === '-') {
                continue
            }

            const isExclusive = QueryBuilder.EXCLUDE_PATTERN.test(term)
            term = term.replace(QueryBuilder.TERM_CLEAN_PATTERN, '')

            if (QueryBuilder.DOMAIN_TLD_PATTERN.test(term)) {
                const domainIndex = isExclusive ? 'domainExclude' : 'domain'

                this[domainIndex].add(term)
                continue
            }

            if (QueryBuilder.HASH_TAG_PATTERN.test(term)) {
                this.tags.add(QueryBuilder.stripTagPattern(term))
                continue
            }

            terms[isExclusive ? 'exclude' : 'include'].push(term)
        }

        return terms
    }

    searchTerm(input = '') {
        // Short-circuit if blank search
        if (!input.trim().length) {
            return this
        }

        // STAGE 1: Filter out tags/domains
        const terms = splitInputIntoTerms(input)
        const { include, exclude } = this._extractTermsPatterns(terms)

        // Short-circuit if all terms filtered out as tags/domains
        if (!include.length && !exclude.length) {
            return this
        }

        // STAGE 2: push through index text-processing logic
        let { text: textInclude } = transformPageText({
            text: include.join(' '),
        })
        let { text: textExclude } = transformPageText({
            text: exclude.join(' '),
        })

        textInclude = textInclude.trim()
        textExclude = textExclude.trim()

        // Search is too vague if nothing left from text-processing
        if (!textInclude.length && !textExclude.length) {
            this.isBadTerm = true
            return this
        }

        if (textInclude.length) {
            // Add post-processed terms to `query` Set
            QueryBuilder.getTermsFromInput(textInclude).forEach((term) =>
                this.query.add(term),
            )
        }

        if (textExclude.length) {
            QueryBuilder.getTermsFromInput(textExclude).forEach((term) =>
                this.queryExclude.add(term),
            )
        }

        return this
    }
}

export default QueryBuilder
