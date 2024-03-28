import type Storex from '@worldbrain/storex'
import * as DATA from './unified-search.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { sortUnifiedBlankSearchResult } from './utils'
import type {
    UnifiedBlankSearchPageResultData,
    UnifiedBlankSearchParams,
    UnifiedBlankSearchResult,
    UnifiedTermsSearchParams,
} from './types'
import type { BackgroundModules } from 'src/background-script/setup'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

async function insertTestData(storageManager: Storex) {
    for (const doc of Object.values(DATA.LISTS)) {
        await storageManager.collection('customLists').createObject(doc)
    }
    for (const doc of Object.values(DATA.PAGES)) {
        await storageManager.collection('pages').createObject(doc)
        if ('listIds' in doc) {
            for (const listId of doc.listIds) {
                await storageManager
                    .collection('pageListEntries')
                    .createObject({
                        listId,
                        pageUrl: doc.url,
                        fullUrl: doc.fullUrl,
                        createdAt: new Date(),
                    })
            }
        }
    }
    for (const doc of Object.values(DATA.BOOKMARKS).flat()) {
        await storageManager.collection('bookmarks').createObject(doc)
    }
    for (const doc of Object.values(DATA.VISITS).flat()) {
        await storageManager.collection('visits').createObject(doc)
    }
    let idCounter = 0
    for (const doc of Object.values(DATA.ANNOTATIONS).flat()) {
        await storageManager.collection('annotations').createObject(doc)
        const privacyLevel =
            'listIds' in doc
                ? AnnotationPrivacyLevels.PROTECTED
                : AnnotationPrivacyLevels.SHARED
        await storageManager
            .collection('annotationPrivacyLevels')
            .createObject({
                id: idCounter++,
                annotation: doc.url,
                privacyLevel,
                createdWhen: new Date(),
                updatedWhen: null,
            })

        if ('listIds' in doc) {
            for (const listId of doc.listIds) {
                await storageManager
                    .collection('annotListEntries')
                    .createObject({
                        listId,
                        url: doc.url,
                        createdAt: new Date(),
                    })
            }
        }
    }
}

async function setupTest(opts?: { skipDataInsertion?: boolean }) {
    const setup = await setupBackgroundIntegrationTest()
    if (!opts?.skipDataInsertion) {
        await insertTestData(setup.storageManager)
    }
    return setup
}

const blankSearch = (
    { search }: BackgroundModules,
    params: Partial<UnifiedBlankSearchParams>,
) =>
    search['unifiedBlankSearch']({
        filterByDomains: [],
        filterByListIds: [],
        lowestTimeBound: 0,
        daysToSearch: 1,
        query: '',
        ...params,
    })

const termsSearch = (
    { search }: BackgroundModules,
    params: Partial<UnifiedTermsSearchParams> & { query: string },
) =>
    search['unifiedTermsSearch']({
        filterByDomains: [],
        filterByListIds: [],
        ...params,
    })

const formatResults = (result: UnifiedBlankSearchResult) => {
    const sortedResults = sortUnifiedBlankSearchResult(result)
    return sortedResults.map(([pageId, data]) => [
        pageId,
        {
            // Not caring much about asserting the annot data apart from IDs
            annotIds: data.annotations.map((a) => a.url),
            latestPageTimestamp: data.latestPageTimestamp,
        },
    ])
}

describe('Unified search tests', () => {
    describe('blank search tests', () => {
        it('should return nothing when no data on blank search', async () => {
            const { backgroundModules } = await setupTest({
                skipDataInsertion: true,
            })
            const now = Date.now()
            const resultA = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect([...resultA.resultDataByPage]).toEqual([])
        })

        it('should return most-recent highlights and their pages on unfiltered, unbounded blank search', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const lowestTimeBound = await backgroundModules.search[
                'calcSearchLowestTimeBound'
            ]()
            const resultA = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                daysToSearch: 1,
                lowestTimeBound,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect(formatResults(resultA)).toEqual([
                [
                    DATA.PAGE_ID_11,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_11][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_8,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][1].time,
                    },
                ],
                [
                    DATA.PAGE_ID_10,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_10][0].url],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_10][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_2,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_2][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][0].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_5][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_9,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_9][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_7][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_6,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_6][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_3][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
        })

        // Check comments scattered throughout this test for more details, as things are quite intentionally structured around the test data timestamps
        it('should return most-recent highlights and their pages on unfiltered, paginated blank search', async () => {
            const { backgroundModules } = await setupTest()
            const lowestTimeBound = await backgroundModules.search[
                'calcSearchLowestTimeBound'
            ]()
            const resultA = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-25T20:00').valueOf(), // This is calculated based on the test data times
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultB = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-24T20:00').valueOf(),
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultC = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-23T20:00').valueOf(),
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultD = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-22T20:00').valueOf(),
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultE = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-21T20:00').valueOf(),
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultF = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-20T20:00').valueOf(),
                daysToSearch: 1,
                lowestTimeBound,
            })
            const resultG = await blankSearch(backgroundModules, {
                untilWhen: new Date('2024-03-19T20:00').valueOf(),
                daysToSearch: 30, // We're really skipping ahead here as we know there's no data until about a month back
                lowestTimeBound,
            })
            expect(resultA.resultsExhausted).toBe(false)
            expect(resultB.resultsExhausted).toBe(false)
            expect(resultC.resultsExhausted).toBe(false)
            expect(resultD.resultsExhausted).toBe(false)
            expect(resultE.resultsExhausted).toBe(false)
            expect(resultF.resultsExhausted).toBe(false)
            expect(resultG.resultsExhausted).toBe(true)
            expect(formatResults(resultA)).toEqual([
                [
                    DATA.PAGE_ID_11,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_11][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_8,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][1].time,
                    },
                ],
                [
                    DATA.PAGE_ID_10,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_10][0].url],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_10][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_2,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_2][0].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_2
                        ][2].lastEdited.valueOf(),
                    },
                ],
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][0].url,
                            // These two should come in the next results "page", being a few days older
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_5
                        ][0].lastEdited.valueOf(),
                    },
                ],
            ])

            // Should be an empty result "page" - nothing on this day
            expect(formatResults(resultB)).toEqual([])

            expect(formatResults(resultC)).toEqual([
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_12
                        ][0].lastEdited.valueOf(),
                    },
                ],
                [
                    DATA.PAGE_ID_9,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_9][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][0].lastEdited.valueOf(),
                    },
                ],
                [
                    DATA.PAGE_ID_8, // Shows up a second time due to a second visit
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_7][0].time,
                    },
                ],
            ])

            expect(formatResults(resultD)).toEqual([
                [
                    DATA.PAGE_ID_4, // Shows up a second time to get in some older annotations
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][9].lastEdited.valueOf(),
                    },
                ],
                [
                    DATA.PAGE_ID_6,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_6][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][0].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_5][0].time,
                    },
                ],
            ])
            expect(formatResults(resultE)).toEqual([
                [
                    DATA.PAGE_ID_4, // Shows up a third time to get in the oldest annotations
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_3][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_3][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_2, // Shows up again because its bookmark is a few days older than all of its annotations
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_2][0].time,
                    },
                ],
            ])

            expect(formatResults(resultF)).toEqual([
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
            // This is the final 30 day period search to pick up this last result, which is ~1 month before all the other data
            expect(formatResults(resultG)).toEqual([
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
                    },
                ],
            ])
        })

        it('should return recent highlights and their pages on list filtered blank search', async () => {
            const { backgroundModules } = await setupTest()
            const lowestTimeBound = await backgroundModules.search[
                'calcSearchLowestTimeBound'
            ]()
            const now = Date.now()
            const resultA = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByListIds: [DATA.LIST_ID_1],
            })
            const resultB = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByListIds: [DATA.LIST_ID_1, DATA.LIST_ID_3], // Multiple values do an AND
            })
            const resultC = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByListIds: [DATA.LIST_ID_2],
            })
            const resultD = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByListIds: [DATA.LIST_ID_2, DATA.LIST_ID_3], // Should be no overlaps
            })

            expect(resultA.resultsExhausted).toBe(true)
            expect(resultB.resultsExhausted).toBe(true)
            expect(resultC.resultsExhausted).toBe(true)
            expect(resultD.resultsExhausted).toBe(true)
            expect(formatResults(resultA)).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
            expect(formatResults(resultB)).toEqual([
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
            expect(formatResults(resultC)).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            // Thess ones are selectively shared to a different list to the parent page, thus get omitted
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
            ])
            expect(formatResults(resultD)).toEqual([])
        })

        it('should return recent highlights and their pages on domain filtered blank search', async () => {
            const { backgroundModules } = await setupTest()
            const lowestTimeBound = await backgroundModules.search[
                'calcSearchLowestTimeBound'
            ]()
            const now = Date.now()
            const resultA = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByDomains: ['test.com'],
            })
            const resultB = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            })
            const resultC = await blankSearch(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                lowestTimeBound,
                filterByDomains: [
                    'wikipedia.org',
                    'en.wikipedia.org',
                    'test-2.com',
                    'en.test-2.com',
                    'test.com',
                ],
            })

            expect(resultA.resultsExhausted).toBe(true)
            expect(resultB.resultsExhausted).toBe(true)
            expect(formatResults(resultA).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_10,
            ])
            expect(formatResults(resultB).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_9,
            ])
            expect(formatResults(resultC).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_11,
                DATA.PAGE_ID_8,
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_2,
                DATA.PAGE_ID_5,
                DATA.PAGE_ID_12,
                DATA.PAGE_ID_9,
                DATA.PAGE_ID_4,
                DATA.PAGE_ID_7,
                DATA.PAGE_ID_6,
                DATA.PAGE_ID_3,
                DATA.PAGE_ID_1,
            ])
        })
    })

    describe('terms search tests', () => {
        it('should return nothing when no data on blank search', async () => {
            const { backgroundModules } = await setupTest({
                skipDataInsertion: true,
            })
            const now = Date.now()
            const resultA = await termsSearch(backgroundModules, {
                query: 'test',
                fromWhen: 0,
                untilWhen: now,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect([...resultA.resultDataByPage]).toEqual([])
        })

        it('should return most-recent highlights and their pages on unfiltered, unbounded terms search', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const lowestTimeBound = await backgroundModules.search[
                'calcSearchLowestTimeBound'
            ]()
            const resultA = await termsSearch(backgroundModules, {
                query: 'test',
                fromWhen: 0,
                untilWhen: now,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect(formatResults(resultA)).toEqual([
                [
                    DATA.PAGE_ID_11,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_11][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_8,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][1].time,
                    },
                ],
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [
                            // None of these contain the search term
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_5][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_9, // Doesn't contain the term, but has an annotation with it
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_9][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_9][1].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_9][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_9][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][9].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][7].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][6].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][5].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_7][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_6,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_6][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_3][3].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_3][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_3][1].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_3][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_3][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
        })
    })
})
