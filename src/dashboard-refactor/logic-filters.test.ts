import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { setupTest } from './logic.test.util'
import {
    parseSearchQuery,
    constructQueryString,
    syncQueryStringFilters,
} from './logic-filters'
import TEST_DATA from './logic-filters.test.data'

// parsing tests
describe('Search query string parsion logic', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        if (!parsedQuery) continue
        it(`Should accurately parse the string "${queryString}" into search terms and filters`, () => {
            const searchDetailArray = parseSearchQuery(queryString)
            // if (!parsedQuery) {
            //     expect(searchDetailArray).toBeNull()
            // }
            expect(searchDetailArray).toEqual(parsedQuery)
        })
    }
})

// construct string tests
describe('Search query string construction logic', () => {
    for (const { queryString, parsedQuery } of TEST_DATA) {
        if (!parsedQuery) continue
        it(`Should accurately return the string "${queryString}" from its parsed query array`, () => {
            const constructedString = constructQueryString(parsedQuery)
            if (typeof constructedString === 'undefined') {
                expect(queryString).toBeNull()
            }
            expect(constructedString).toEqual(queryString)
        })
    }
})

// filter mutations
describe('Filter parsing logic', () => {
    for (const { queryString, filtersData } of TEST_DATA) {
        if (!filtersData) {
            continue
        }
        const { newFilterDetail, newQuery } = filtersData
        it(`Should correctly update the query string '${queryString}' to '${newQuery}'`, () => {
            const resultString = syncQueryStringFilters(
                queryString,
                newFilterDetail,
            )
            expect(resultString).toEqual(newQuery)
        })
    }
})

describe('Dashboard search filters logic', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should be able to set the search query', async ({ device }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.searchQuery).toEqual('')
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('setSearchQuery', { query: testQuery })

        expect(searchResults.state.searchFilters.searchQuery).toEqual(testQuery)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)
    })

    it('should be able to set the search bar focus', async ({ device }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.searchFilters.isSearchBarFocused).toEqual(
            false,
        )
        await searchResults.processEvent('setSearchBarFocus', {
            isFocused: true,
        })
        expect(searchResults.state.searchFilters.isSearchBarFocused).toEqual(
            true,
        )
        await searchResults.processEvent('setSearchBarFocus', {
            isFocused: false,
        })
        expect(searchResults.state.searchFilters.isSearchBarFocused).toEqual(
            false,
        )
    })

    it('should be able to set the search filter bar open state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.searchFilters.searchFiltersOpen).toEqual(
            false,
        )
        await searchResults.processEvent('setSearchFiltersOpen', {
            isOpen: true,
        })
        expect(searchResults.state.searchFilters.searchFiltersOpen).toEqual(
            true,
        )
        await searchResults.processEvent('setSearchFiltersOpen', {
            isOpen: false,
        })
        expect(searchResults.state.searchFilters.searchFiltersOpen).toEqual(
            false,
        )
    })

    it('should be able to set the tag filter active state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.searchFilters.isTagFilterActive).toEqual(
            false,
        )
        await searchResults.processEvent('setTagFilterActive', {
            isActive: true,
        })
        expect(searchResults.state.searchFilters.isTagFilterActive).toEqual(
            true,
        )
        await searchResults.processEvent('setTagFilterActive', {
            isActive: false,
        })
        expect(searchResults.state.searchFilters.isTagFilterActive).toEqual(
            false,
        )
    })

    it('should be able to set the domain filter active state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.searchFilters.isDomainFilterActive).toEqual(
            false,
        )
        await searchResults.processEvent('setDomainFilterActive', {
            isActive: true,
        })
        expect(searchResults.state.searchFilters.isDomainFilterActive).toEqual(
            true,
        )
        await searchResults.processEvent('setDomainFilterActive', {
            isActive: false,
        })
        expect(searchResults.state.searchFilters.isDomainFilterActive).toEqual(
            false,
        )
    })

    it('should be able to set the date filter active state', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)

        expect(searchResults.state.searchFilters.isDateFilterActive).toEqual(
            false,
        )
        await searchResults.processEvent('setDateFilterActive', {
            isActive: true,
        })
        expect(searchResults.state.searchFilters.isDateFilterActive).toEqual(
            true,
        )
        await searchResults.processEvent('setDateFilterActive', {
            isActive: false,
        })
        expect(searchResults.state.searchFilters.isDateFilterActive).toEqual(
            false,
        )
    })

    it('should be able to set the date from filter value', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })
        const dateValue = 1
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.dateFrom).toBeUndefined()
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('setDateFrom', {
            value: dateValue,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.dateFrom).toEqual(dateValue)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)
    })

    it('should be able to set the date to filter value', async ({ device }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })
        const dateValue = 1
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.dateTo).toBeUndefined()
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('setDateTo', {
            value: dateValue,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.dateTo).toEqual(dateValue)
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)
    })

    it('should be able to set the date from NLP input value', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)
        const dateValue = 'test'
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.dateFromInput).toEqual('')
        await searchResults.processEvent('setDateFromInputValue', {
            value: dateValue,
            searchQuery: testQuery,
        })
        expect(searchResults.state.searchFilters.dateFromInput).toEqual(
            dateValue,
        )
    })

    it('should be able to set the date to NLP input value', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device)
        const dateValue = 'test'
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.dateToInput).toEqual('')
        await searchResults.processEvent('setDateToInputValue', {
            value: dateValue,
            searchQuery: testQuery,
        })
        expect(searchResults.state.searchFilters.dateToInput).toEqual(dateValue)
    })

    it('should be able to add and remove included + excluded tag filters', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })
        const tag1 = 'test'
        const tag2 = 'test again'
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.tagsIncluded).toEqual([])
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('addIncludedTag', {
            tag: tag1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsIncluded).toEqual([tag1])
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)

        await searchResults.processEvent('addIncludedTag', {
            tag: tag2,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsIncluded).toEqual([
            tag1,
            tag2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(2)

        await searchResults.processEvent('delIncludedTag', {
            tag: tag1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsIncluded).toEqual([tag2])
        expect(searchResults.logic['searchTriggeredCount']).toBe(3)

        expect(searchResults.state.searchFilters.tagsExcluded).toEqual([])

        await searchResults.processEvent('addExcludedTag', {
            tag: tag1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsExcluded).toEqual([tag1])
        expect(searchResults.logic['searchTriggeredCount']).toBe(4)

        await searchResults.processEvent('addExcludedTag', {
            tag: tag2,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsExcluded).toEqual([
            tag1,
            tag2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(5)

        await searchResults.processEvent('delExcludedTag', {
            tag: tag1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.tagsExcluded).toEqual([tag2])
        expect(searchResults.logic['searchTriggeredCount']).toBe(6)
    })

    it('should be able to add and remove included + excluded domain filters', async ({
        device,
    }) => {
        const { searchResults } = await setupTest(device, {
            overrideSearchTrigger: true,
        })
        const domain1 = 'test.com'
        const domain2 = 'getmemex.com'
        const testQuery = 'test'

        expect(searchResults.state.searchFilters.domainsIncluded).toEqual([])
        expect(searchResults.logic['searchTriggeredCount']).toBe(0)

        await searchResults.processEvent('addIncludedDomain', {
            domain: domain1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsIncluded).toEqual([
            domain1,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(1)

        await searchResults.processEvent('addIncludedDomain', {
            domain: domain2,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsIncluded).toEqual([
            domain1,
            domain2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(2)

        await searchResults.processEvent('delIncludedDomain', {
            domain: domain1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsIncluded).toEqual([
            domain2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(3)

        expect(searchResults.state.searchFilters.domainsExcluded).toEqual([])

        await searchResults.processEvent('addExcludedDomain', {
            domain: domain1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsExcluded).toEqual([
            domain1,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(4)

        await searchResults.processEvent('addExcludedDomain', {
            domain: domain2,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsExcluded).toEqual([
            domain1,
            domain2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(5)

        await searchResults.processEvent('delExcludedDomain', {
            domain: domain1,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters.domainsExcluded).toEqual([
            domain2,
        ])
        expect(searchResults.logic['searchTriggeredCount']).toBe(6)
    })

    it('should be able to reset filters', async ({ device }) => {
        const { searchResults, logic } = await setupTest(device, {
            overrideSearchTrigger: true,
        })

        const tag1 = 'test'
        const tag2 = 'test again'
        const domain1 = 'test.com'
        const domain2 = 'getmemex.com'
        const query = 'test'
        const dateTo = 123
        const dateFrom = 123
        const testQuery = 'test'

        await searchResults.processEvent('addIncludedTag', {
            tag: tag1,
            searchQuery: testQuery,
        })
        await searchResults.processEvent('addExcludedTag', {
            tag: tag2,
            searchQuery: testQuery,
        })
        await searchResults.processEvent('addIncludedDomain', {
            domain: domain1,
            searchQuery: testQuery,
        })
        await searchResults.processEvent('addExcludedDomain', {
            domain: domain2,
            searchQuery: testQuery,
        })
        await searchResults.processEvent('setSearchQuery', { query })
        await searchResults.processEvent('setDateFrom', {
            value: dateFrom,
            searchQuery: testQuery,
        })
        await searchResults.processEvent('setDateTo', {
            value: dateTo,
            searchQuery: testQuery,
        })

        expect(searchResults.state.searchFilters).toEqual(
            expect.objectContaining({
                searchQuery: query,
                tagsIncluded: [tag1],
                tagsExcluded: [tag2],
                domainsIncluded: [domain1],
                domainsExcluded: [domain2],
                dateFrom,
                dateTo,
            }),
        )

        await searchResults.processEvent('resetFilters', null)

        expect(searchResults.logic['searchTriggeredCount']).toBe(8)
        expect(searchResults.state.searchFilters).toEqual(
            expect.objectContaining({
                ...logic.getInitialState().searchFilters,
            }),
        )
    })
})
