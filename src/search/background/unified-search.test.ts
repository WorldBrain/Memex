import omit from 'lodash/omit'
import type Storex from '@worldbrain/storex'
import * as DATA from './unified-search.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { splitQueryIntoTerms } from './utils'
import type {
    UnifiedSearchPaginationParams,
    IntermediarySearchResult,
    UnifiedSearchParams,
} from '@worldbrain/memex-common/lib/search/types'
import type { BackgroundModules } from 'src/background-script/setup'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { sortSearchResult } from '@worldbrain/memex-common/lib/search/utils'

async function insertTestData(storageManager: Storex) {
    for (const doc of Object.values(DATA.LISTS)) {
        await storageManager.collection('customLists').createObject(doc)
    }
    for (const doc of Object.values(DATA.PAGES)) {
        await storageManager
            .collection('pages')
            .createObject(omit(doc, 'listIds'))

        const [latestTimestamp] = [
            ...(DATA.VISITS[doc.url] ?? []),
            ...(DATA.BOOKMARKS[doc.url] ?? []),
        ]
            .filter(Boolean)
            .map((a) => a.time as number)
            .sort((a, b) => b - a)

        if ('listIds' in doc) {
            for (const listId of doc.listIds) {
                await storageManager
                    .collection('pageListEntries')
                    .createObject({
                        listId,
                        pageUrl: doc.url,
                        fullUrl: doc.fullUrl,
                        createdAt: new Date(latestTimestamp),
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
        await storageManager
            .collection('annotations')
            .createObject(omit(doc, 'listIds'))
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
                        createdAt: new Date(doc.createdWhen),
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

const search = async (
    { search }: BackgroundModules,
    params: Partial<UnifiedSearchParams & UnifiedSearchPaginationParams>,
) => {
    return search['unifiedIntermediarySearch']({
        filterByDomains: [],
        filterByListIds: [],
        query: '',
        limit: 10,
        skip: 0,
        ...params,
    })
}

const formatResults = (
    result: IntermediarySearchResult,
    opts?: { skipSorting?: boolean },
) => {
    const sortedResults = opts?.skipSorting
        ? [...result.resultDataByPage]
        : sortSearchResult(result.resultDataByPage)
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
            const resultA = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                limit: 99999,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect([...resultA.resultDataByPage]).toEqual([])
        })

        it('should return most-recent highlights and their pages on unfiltered, unbounded blank search', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const resultA = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: now,
                limit: 99999,
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
                    DATA.PAGE_ID_13,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_13][0].time,
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
            const resultA = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: new Date('2024-03-25T20:00').valueOf(), // This is calculated based on the test data times
                limit: 10,
            })
            const resultB = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: resultA.oldestResultTimestamp,
                limit: 10,
            })
            const resultC = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: resultB.oldestResultTimestamp,
                limit: 10,
            })
            const resultD = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: resultC.oldestResultTimestamp,
                limit: 10,
            })
            const resultE = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: resultD.oldestResultTimestamp,
                limit: 10,
            })
            const resultF = await search(backgroundModules, {
                fromWhen: 0,
                untilWhen: resultE.oldestResultTimestamp,
                limit: 10,
            })
            expect(resultA.resultsExhausted).toBe(false)
            expect(resultB.resultsExhausted).toBe(false)
            expect(resultC.resultsExhausted).toBe(false)
            expect(resultD.resultsExhausted).toBe(false)
            expect(resultE.resultsExhausted).toBe(true)
            expect(resultF.resultsExhausted).toBe(true)
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
                    DATA.PAGE_ID_13,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_13][0].time,
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

            expect(formatResults(resultB)).toEqual([
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
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url, // This will be in the next results page
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_7
                        ][3].lastEdited.valueOf(),
                    },
                ],
            ])

            expect(formatResults(resultC)).toEqual([
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url, // These came in the prev page
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_7][0].time,
                    },
                ],
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
            ])
            expect(formatResults(resultD)).toEqual([
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
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_3
                        ][3].lastEdited.valueOf(),
                    },
                ],
            ])
            expect(formatResults(resultE)).toEqual([
                // TODO: Ideally this result gets ommitted as it's already shown in the previous results page with all the annots.
                //   It shows again because there's a visit before the annots that's just on the cut-off point between results pages.
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [],
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
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
                    },
                ],
            ])
            expect(formatResults(resultF)).toEqual([])
        })

        it('should return most-recent highlights and their pages on unfiltered, paginated blank search with lower time bound set', async () => {
            const { backgroundModules } = await setupTest()
            const lowerBound = new Date('2024-03-22T06:10').valueOf()
            const resultA = await search(backgroundModules, {
                fromWhen: lowerBound,
                untilWhen: new Date('2024-03-25T20:00').valueOf(), // This is calculated based on the test data times
                limit: 10,
            })
            const resultB = await search(backgroundModules, {
                fromWhen: lowerBound,
                untilWhen: resultA.oldestResultTimestamp,
                limit: 10,
            })
            const resultC = await search(backgroundModules, {
                fromWhen: lowerBound,
                untilWhen: resultB.oldestResultTimestamp,
                limit: 10,
            })
            // This should be beyond the scope of the lower time bound, thus should return no results
            const resultD = await search(backgroundModules, {
                fromWhen: lowerBound,
                untilWhen: resultC.oldestResultTimestamp,
                limit: 10,
            })
            expect(resultA.resultsExhausted).toBe(false)
            expect(resultB.resultsExhausted).toBe(false)
            expect(resultC.resultsExhausted).toBe(true)
            expect(resultD.resultsExhausted).toBe(true)
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
                    DATA.PAGE_ID_13,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_13][0].time,
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

            expect(formatResults(resultB)).toEqual([
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
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url, // This will be in the next results page
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_7
                        ][3].lastEdited.valueOf(),
                    },
                ],
            ])

            expect(formatResults(resultC)).toEqual([
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url, // These came in the prev page
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_7][0].time,
                    },
                ],
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
            ])
            expect(formatResults(resultD)).toEqual([])
        })

        it('should return recent highlights and their pages on list filtered blank search', async () => {
            const { backgroundModules } = await setupTest()

            const resultA = await search(backgroundModules, {
                filterByListIds: [DATA.LIST_ID_1],
            })
            const resultB = await search(backgroundModules, {
                filterByListIds: [DATA.LIST_ID_1, DATA.LIST_ID_3], // Multiple values do an AND
            })
            const resultC = await search(backgroundModules, {
                filterByListIds: [DATA.LIST_ID_2],
            })
            const resultD = await search(backgroundModules, {
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
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][1].lastEdited.valueOf(),
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
                            // These ones are selectively shared to a different list to the parent page, thus get omitted
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
            const resultA = await search(backgroundModules, {
                limit: 9999,
                filterByDomains: ['test.com'],
            })
            const resultB = await search(backgroundModules, {
                limit: 9999,
                filterByDomains: ['en.test-2.com', 'test.com'], // Multiple values do an OR
            })
            const resultC = await search(backgroundModules, {
                filterByDomains: [
                    'wikipedia.org',
                    'en.wikipedia.org',
                    'test-2.com',
                    'en.test-2.com',
                    'test.com',
                ],
            })
            const resultD = await search(backgroundModules, {
                filterByDomains: [
                    'wikipedia.org',
                    'en.wikipedia.org',
                    'test-2.com',
                    'en.test-2.com',
                    'test.com',
                ],
                untilWhen: resultC.oldestResultTimestamp,
            })
            const resultE = await search(backgroundModules, {
                filterByDomains: [
                    'wikipedia.org',
                    'en.wikipedia.org',
                    'test-2.com',
                    'en.test-2.com',
                    'test.com',
                ],
                untilWhen: resultD.oldestResultTimestamp,
            })

            expect(resultA.resultsExhausted).toBe(true)
            expect(resultB.resultsExhausted).toBe(true)
            expect(resultC.resultsExhausted).toBe(false)
            expect(resultD.resultsExhausted).toBe(false)
            expect(resultE.resultsExhausted).toBe(true)
            expect(formatResults(resultA).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_10,
            ])
            expect(formatResults(resultB).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_9,
            ])
            expect(formatResults(resultC).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_2,
                DATA.PAGE_ID_9,
            ])
            expect(formatResults(resultD).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_9,
            ])
            expect(formatResults(resultE).map(([pageId]) => pageId)).toEqual([
                DATA.PAGE_ID_2,
                DATA.PAGE_ID_1,
            ])
        })
    })

    describe('terms search tests', () => {
        it('should return nothing when no data on terms search', async () => {
            const { backgroundModules } = await setupTest({
                skipDataInsertion: true,
            })
            const now = Date.now()
            const resultA = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect([...resultA.resultDataByPage]).toEqual([])
        })

        it('should return highlights and their pages on unfiltered, unbounded terms search', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const resultA = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect(formatResults(resultA, { skipSorting: true })).toEqual([
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
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_9
                        ][1].lastEdited.valueOf(),
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
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
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
        it('should return the right page when searching for chinese characters', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const resultA = await search(backgroundModules, {
                query: '微软第三财季营收',
                limit: 1000,
                skip: 0,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect(formatResults(resultA, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_13,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_13][0].time,
                    },
                ],
            ])
        })

        it('should return highlights and their pages on unfiltered, paginated terms search', async () => {
            const { backgroundModules } = await setupTest()

            const resultA = await search(backgroundModules, {
                query: 'test',
                limit: 5,
                skip: 0,
            })
            const resultB = await search(backgroundModules, {
                query: 'test',
                limit: 5,
                skip: 5,
            })
            const resultC = await search(backgroundModules, {
                query: 'test',
                limit: 5,
                skip: 10,
            })
            expect(resultA.resultsExhausted).toBe(false)
            expect(resultB.resultsExhausted).toBe(false)
            expect(resultC.resultsExhausted).toBe(true)
            expect(formatResults(resultC, { skipSorting: true })).toEqual([])
            expect(formatResults(resultA, { skipSorting: true })).toEqual([
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
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_9
                        ][1].lastEdited.valueOf(),
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
            ])
            expect(formatResults(resultB, { skipSorting: true })).toEqual([
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
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
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

            // Now test multi-terms search (should "AND" all terms)
            const resultD = await search(backgroundModules, {
                query: 'honshu',
                limit: 10,
                skip: 0,
            })
            const resultE = await search(backgroundModules, {
                query: 'honshu test',
                limit: 10,
                skip: 0,
            })
            expect(resultD.resultsExhausted).toBe(true)
            expect(resultE.resultsExhausted).toBe(true)
            expect(formatResults(resultD, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][4].lastEdited.valueOf(),
                    },
                ],
            ])
            expect(formatResults(resultE, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][4].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][3].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][2].lastEdited.valueOf(),
                    },
                ],
            ])
        })

        it('should return highlights and their pages on list filtered, paginated terms search', async () => {
            const { backgroundModules } = await setupTest()

            const resultA = await search(backgroundModules, {
                query: 'test',
                limit: 1,
                skip: 0,
                filterByListIds: [DATA.LIST_ID_1],
            })
            const resultB = await search(backgroundModules, {
                query: 'test',
                limit: 1,
                skip: 1,
                filterByListIds: [DATA.LIST_ID_1],
            })
            const resultC = await search(backgroundModules, {
                query: 'test',
                limit: 1,
                skip: 2,
                filterByListIds: [DATA.LIST_ID_1],
            })

            expect(resultA.resultsExhausted).toBe(false)
            expect(resultB.resultsExhausted).toBe(false)
            expect(resultC.resultsExhausted).toBe(true)
            expect(formatResults(resultA, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
            ])
            expect(formatResults(resultB, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])
            expect(formatResults(resultC, { skipSorting: true })).toEqual([])

            // NOTE: Same query as above, but with a bigger pag limit
            const resultD = await search(backgroundModules, {
                query: 'test',
                limit: 10,
                skip: 0,
                filterByListIds: [DATA.LIST_ID_1],
            })
            expect(resultD.resultsExhausted).toBe(true)
            // NOTE: Same results as above, but all together
            expect(formatResults(resultD, { skipSorting: true })).toEqual([
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

            // NOTE: Same query as above, but with multiple terms (ANDed)
            const resultE = await search(backgroundModules, {
                query: 'test honshu',
                limit: 10,
                skip: 0,
                filterByListIds: [DATA.LIST_ID_1],
            })
            expect(resultE.resultsExhausted).toBe(true)
            expect(formatResults(resultE, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_4
                        ][2].lastEdited.valueOf(),
                    },
                ],
            ])

            const resultF = await search(backgroundModules, {
                query: 'test',
                limit: 10,
                skip: 0,
                filterByListIds: [DATA.LIST_ID_1, DATA.LIST_ID_3], // Multiple values do an AND
            })
            expect(resultF.resultsExhausted).toBe(true)
            expect(formatResults(resultF, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_1,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_1][0].time,
                    },
                ],
            ])

            const resultG = await search(backgroundModules, {
                query: 'test',
                limit: 10,
                skip: 0,
                filterByListIds: [DATA.LIST_ID_2],
            })
            expect(resultG.resultsExhausted).toBe(true)
            expect(formatResults(resultG)).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][8].url,
                            // Thess ones are selectively shared to a different list to the parent page, thus get omitted (even though they match the terms)
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
            ])
        })

        it('should return highlights and their pages on domain filtered, paginated terms search', async () => {
            const { backgroundModules } = await setupTest()

            // const resultA = await blankSearch(backgroundModules, {
            //     fromWhen: 0,
            //     untilWhen: now,
            //     lowestTimeBound,
            //     filterByDomains: ['test.com'],
            // })
            // const resultB = await blankSearch(backgroundModules, {
            //     fromWhen: 0,
            //     untilWhen: now,
            //     lowestTimeBound,
            //     filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            // })
            // const resultC = await blankSearch(backgroundModules, {
            //     fromWhen: 0,
            //     untilWhen: now,
            //     lowestTimeBound,
            //     filterByDomains: [
            //         'wikipedia.org',
            //         'en.wikipedia.org',
            //         'test-2.com',
            //         'en.test-2.com',
            //         'test.com',
            //     ],
            // })

            const resultA = await search(backgroundModules, {
                query: 'term',
                limit: 100,
                skip: 0,
                filterByDomains: ['test.com'],
            })
            const resultB = await search(backgroundModules, {
                query: 'term',
                limit: 100,
                skip: 0,
                filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            })
            // Same as prev but paginated
            const resultC = await search(backgroundModules, {
                query: 'term',
                limit: 1,
                skip: 0,
                filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            })
            const resultD = await search(backgroundModules, {
                query: 'term',
                limit: 2,
                skip: 1,
                filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            })

            // Same as prev but with multiple terms, which are only in one of the results
            const resultE = await search(backgroundModules, {
                query: 'term phyla',
                limit: 20,
                skip: 0,
                filterByDomains: ['test-2.com', 'test.com'], // Multiple values do an OR
            })

            expect(resultA.resultsExhausted).toBe(true)
            expect(resultB.resultsExhausted).toBe(true)
            expect(resultC.resultsExhausted).toBe(false)
            expect(resultD.resultsExhausted).toBe(true)
            expect(resultE.resultsExhausted).toBe(true)
            expect(
                formatResults(resultA, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([DATA.PAGE_ID_10])
            expect(
                formatResults(resultB, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([DATA.PAGE_ID_10, DATA.PAGE_ID_9])
            expect(
                formatResults(resultC, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([DATA.PAGE_ID_10])
            expect(
                formatResults(resultD, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([DATA.PAGE_ID_9])
            expect(
                formatResults(resultE, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([DATA.PAGE_ID_9])
        })

        it('should return highlights and their pages that match double-quoted exact terms', async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()

            const resultA = await search(backgroundModules, {
                query: '"some nonsense test text"',
                limit: 1000,
                skip: 0,
            })
            const resultB = await search(backgroundModules, {
                query: '"apples, oranges"',
                limit: 1000,
                skip: 0,
            })
            const resultC = await search(backgroundModules, {
                query: '"some nonsense test text" oranges',
                limit: 1000,
                skip: 0,
            })
            const resultD = await search(backgroundModules, {
                query: '"monophyly and validity"',
                limit: 1000,
                skip: 0,
            })
            expect(resultA.resultsExhausted).toBe(true)
            expect(resultB.resultsExhausted).toBe(true)
            expect(resultC.resultsExhausted).toBe(true)
            expect(resultC.resultsExhausted).toBe(true)
            expect(formatResults(resultA, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_4,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
            ])
            expect(formatResults(resultB, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_2,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_2][0].time,
                    },
                ],
            ])
            expect(formatResults(resultC, { skipSorting: true })).toEqual([]) // No overlap
            expect(formatResults(resultD, { skipSorting: true })).toEqual([
                [
                    DATA.PAGE_ID_2,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_2][2].url],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_2
                        ][2].lastEdited.valueOf(),
                    },
                ],
            ])
        })
    })

    describe('search filter tests', () => {
        it('should be able to filter PDF pages in blank and terms search', async () => {
            const { backgroundModules } = await setupTest()
            const blankResultA = await search(backgroundModules, {
                limit: 1000,
                filterByPDFs: true,
            })
            const termsResultB = await search(backgroundModules, {
                query: 'text',
                limit: 1000,
                skip: 0,
                filterByPDFs: true,
            })
            const termsResultC = await search(backgroundModules, {
                query: 'test', // NOTE: Different term
                limit: 1000,
                skip: 0,
                filterByPDFs: true,
            })
            expect(blankResultA.resultsExhausted).toBe(true)
            expect(termsResultB.resultsExhausted).toBe(true)
            expect(termsResultC.resultsExhausted).toBe(true)
            expect(formatResults(blankResultA)).toEqual([
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
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
            ])
            expect(formatResults(termsResultB)).toEqual([
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
                    },
                ],
            ])
            expect(formatResults(termsResultC)).toEqual([
                [
                    DATA.PAGE_ID_12,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                        latestPageTimestamp:
                            DATA.BOOKMARKS[DATA.PAGE_ID_12][0].time,
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
            ])
        })

        it('should be able to filter video pages in blank and terms search', async () => {
            const { backgroundModules } = await setupTest()
            const blankResultA = await search(backgroundModules, {
                limit: 1000,
                filterByVideos: true,
            })
            const termsResultB = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
                filterByVideos: true,
            })
            const termsResultC = await search(backgroundModules, {
                query: 'today',
                limit: 1000,
                skip: 0,
                filterByVideos: true,
            })
            expect(blankResultA.resultsExhausted).toBe(true)
            expect(termsResultB.resultsExhausted).toBe(true)
            expect(termsResultC.resultsExhausted).toBe(true)
            expect(formatResults(blankResultA)).toEqual([
                [
                    DATA.PAGE_ID_11,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_11][0].time,
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
            expect(formatResults(termsResultB)).toEqual([
                [
                    DATA.PAGE_ID_11,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_11][0].time,
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
            ])
            expect(formatResults(termsResultC)).toEqual([
                [
                    DATA.PAGE_ID_7,
                    {
                        annotIds: [
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][1].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_7][2].url,
                            DATA.ANNOTATIONS[DATA.PAGE_ID_7][3].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_7
                        ][3].lastEdited.valueOf(),
                    },
                ],
            ])
        })

        it('should be able to filter tweet pages in blank and terms search', async () => {
            const { backgroundModules } = await setupTest()
            const blankResultA = await search(backgroundModules, {
                limit: 1000,
                filterByTweets: true,
            })
            const termsResultB = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
                filterByTweets: true,
            })
            const termsResultC = await search(backgroundModules, {
                query: 'insectum',
                limit: 1000,
                skip: 0,
                filterByTweets: true,
            })
            expect(blankResultA.resultsExhausted).toBe(true)
            expect(termsResultB.resultsExhausted).toBe(true)
            expect(termsResultC.resultsExhausted).toBe(true)
            expect(formatResults(blankResultA)).toEqual([
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
            ])
            expect(formatResults(termsResultB)).toEqual([
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
                            DATA.ANNOTATIONS[DATA.PAGE_ID_4][1].url,
                        ],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_4][0].time,
                    },
                ],
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_5][0].time,
                    },
                ],
            ])
            expect(formatResults(termsResultC)).toEqual([
                [
                    DATA.PAGE_ID_5,
                    {
                        annotIds: [
                            DATA.ANNOTATIONS[DATA.PAGE_ID_5][0].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][2].url,
                            // DATA.ANNOTATIONS[DATA.PAGE_ID_5][1].url,
                        ],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_5
                        ][0].lastEdited.valueOf(),
                    },
                ],
            ])
        })

        it('should be able to filter event pages in blank and terms search', async () => {
            const { backgroundModules } = await setupTest()
            const blankResultA = await search(backgroundModules, {
                limit: 1000,
                filterByEvents: true,
            })
            const termsResultB = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
                filterByEvents: true,
            })
            const termsResultC = await search(backgroundModules, {
                query: 'encyclopedia',
                limit: 1000,
                skip: 0,
                filterByEvents: true,
            })
            expect(blankResultA.resultsExhausted).toBe(true)
            expect(termsResultB.resultsExhausted).toBe(true)
            expect(termsResultC.resultsExhausted).toBe(true)
            expect(formatResults(blankResultA)).toEqual([
                [
                    DATA.PAGE_ID_8,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][1].time,
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
            ])
            expect(formatResults(termsResultB)).toEqual([
                [
                    DATA.PAGE_ID_8,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_8][1].time,
                    },
                ],
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [],
                        latestPageTimestamp:
                            DATA.VISITS[DATA.PAGE_ID_3][0].time,
                    },
                ],
            ])
            expect(formatResults(termsResultC)).toEqual([
                [
                    DATA.PAGE_ID_3,
                    {
                        annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_3][1].url],
                        latestPageTimestamp: DATA.ANNOTATIONS[
                            DATA.PAGE_ID_3
                        ][1].lastEdited.valueOf(),
                    },
                ],
            ])
        })

        it("should be able to filter out all pages which don't contain annotations in blank and terms search", async () => {
            const { backgroundModules } = await setupTest()
            const now = Date.now()
            const blankResultA = await search(backgroundModules, {
                limit: 1000,
                omitPagesWithoutAnnotations: true,
            })
            // Same thing as A, but with pagination
            const blankResultB = await search(backgroundModules, {
                limit: 20,
                omitPagesWithoutAnnotations: true,
            })
            const blankResultC = await search(backgroundModules, {
                limit: 20,
                untilWhen: blankResultB.oldestResultTimestamp,
                omitPagesWithoutAnnotations: true,
            })
            const termsResultA = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
                omitPagesWithoutAnnotations: true,
            })
            expect(blankResultA.resultsExhausted).toBe(true)
            expect(blankResultB.resultsExhausted).toBe(false)
            expect(blankResultC.resultsExhausted).toBe(true)
            expect(termsResultA.resultsExhausted).toBe(true)
            expect(
                formatResults(blankResultA).map(([pageId]) => pageId),
            ).toEqual([
                // DATA.PAGE_ID_11,
                // DATA.PAGE_ID_8,
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_2,
                DATA.PAGE_ID_5,
                DATA.PAGE_ID_12,
                DATA.PAGE_ID_9,
                DATA.PAGE_ID_4,
                DATA.PAGE_ID_7,
                // DATA.PAGE_ID_6,
                DATA.PAGE_ID_3,
                // DATA.PAGE_ID_1,
            ])
            expect(
                formatResults(blankResultB).map(([pageId]) => pageId),
            ).toEqual([
                // DATA.PAGE_ID_11,
                // DATA.PAGE_ID_8,
                DATA.PAGE_ID_10,
                DATA.PAGE_ID_2,
                DATA.PAGE_ID_5,
                DATA.PAGE_ID_12,
                DATA.PAGE_ID_9,
                DATA.PAGE_ID_4,
                DATA.PAGE_ID_7,
            ])
            expect(
                formatResults(blankResultC).map(([pageId]) => pageId),
            ).toEqual([
                DATA.PAGE_ID_4,
                DATA.PAGE_ID_5,
                // The above two get repeated due to having annotations split across the result pages

                // DATA.PAGE_ID_6,
                DATA.PAGE_ID_3,
                // DATA.PAGE_ID_1,
            ])
            expect(
                formatResults(termsResultA, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual([
                // DATA.PAGE_ID_11,
                // DATA.PAGE_ID_8,
                DATA.PAGE_ID_12,
                DATA.PAGE_ID_9, // Doesn't contain the term, but has an annotation with it
                DATA.PAGE_ID_7,
                DATA.PAGE_ID_4,
                // DATA.PAGE_ID_6,
                // DATA.PAGE_ID_5, // Has annots but none contain the search term
                // DATA.PAGE_ID_3, // Likewise
                // DATA.PAGE_ID_1,
            ])
        })
    })

    describe('misc cases', () => {
        it('query splitting should separate multiple terms and phrases surrounded by double-quotes', async () => {
            expect(splitQueryIntoTerms('test test')).toEqual({
                terms: ['test'],
                phrases: [],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(splitQueryIntoTerms('"test test"')).toEqual({
                terms: [],
                phrases: ['test test'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(splitQueryIntoTerms('"test test" test')).toEqual({
                phrases: ['test test'],
                terms: ['test'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(splitQueryIntoTerms('cat "big dog" test')).toEqual({
                terms: ['cat', 'test'],
                phrases: ['big dog'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(
                splitQueryIntoTerms('cat "big dog" test "blue car" red car'),
            ).toEqual({
                terms: ['cat', 'test', 'red', 'car'],
                phrases: ['big dog', 'blue car'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(
                splitQueryIntoTerms(
                    'cat "big dog" test grab yellow "blue car" red car',
                ),
            ).toEqual({
                terms: ['cat', 'test', 'grab', 'yellow', 'red', 'car'],
                phrases: ['big dog', 'blue car'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
            expect(
                splitQueryIntoTerms(
                    // You use silly syntax, you get silly results
                    'cat"big dog" test grab yellow"blue car"red car',
                ),
            ).toEqual({
                terms: ['cat', 'test', 'grab', 'yellow', 'red', 'car'],
                phrases: ['big dog', 'blue car'],
                inComment: true,
                inContent: true,
                inHighlight: true,
                inTitle: true,
                matchTermsFuzzyStartsWith: false,
            })
        })

        it('terms search should still work the same with affixed spaces in query', async () => {
            const { backgroundModules } = await setupTest()
            const termsResultA = await search(backgroundModules, {
                query: 'test',
                limit: 1000,
                skip: 0,
            })
            const termsResultB = await search(backgroundModules, {
                query: ' test ',
                limit: 1000,
                skip: 0,
            })
            const termsResultC = await search(backgroundModules, {
                query: '   test     test     ',
                limit: 1000,
                skip: 0,
            })
            const expectedPages = [
                DATA.PAGE_ID_11,
                DATA.PAGE_ID_8,
                DATA.PAGE_ID_12,
                DATA.PAGE_ID_9, // Doesn't contain the term, but has an annotation with it
                DATA.PAGE_ID_7,
                DATA.PAGE_ID_4,
                DATA.PAGE_ID_6,
                DATA.PAGE_ID_5,
                DATA.PAGE_ID_3,
                DATA.PAGE_ID_1,
            ]
            expect(
                formatResults(termsResultA, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual(expectedPages)
            expect(
                formatResults(termsResultB, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual(expectedPages)
            expect(
                formatResults(termsResultC, { skipSorting: true }).map(
                    ([pageId]) => pageId,
                ),
            ).toEqual(expectedPages)
        })
    })
})
