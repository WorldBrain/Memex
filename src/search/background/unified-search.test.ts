import type Storex from '@worldbrain/storex'
import * as DATA from './unified-search.test.data'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

async function insertTestData(storageManager: Storex) {
    for (const doc of Object.values(DATA.BOOKMARKS).flat()) {
        await storageManager.collection('bookmarks').createObject(doc)
    }
    for (const doc of Object.values(DATA.VISITS).flat()) {
        await storageManager.collection('visits').createObject(doc)
    }
    for (const doc of Object.values(DATA.ANNOTATIONS).flat()) {
        await storageManager.collection('annotations').createObject(doc)
    }
}

async function setupTest(opts?: { skipDataInsertion?: boolean }) {
    const setup = await setupBackgroundIntegrationTest()
    if (!opts?.skipDataInsertion) {
        await insertTestData(setup.storageManager)
    }
    return setup
}

describe('Unified search tests', () => {
    it('should return most-recent highlights and their pages on unfiltered, unbounded blank search', async () => {
        const { backgroundModules } = await setupTest()
        const now = Date.now()

        const resultA = await backgroundModules.search['unifiedBlankSearch']({
            fromWhen: 0,
            untilWhen: now,
            minResultLimit: 100,
            daysToSearch: 1,
        })
        expect(resultA.resultsExhausted).toBe(true)
        const sortedResultPages = [...resultA.resultDataByPage].sort(
            ([, a], [, b]) => b.timestamp - a.timestamp,
        )
        expect(sortedResultPages).toEqual([
            [
                DATA.PAGE_ID_11,
                {
                    annotIds: [],
                    timestamp: DATA.VISITS[DATA.PAGE_ID_11][0].time,
                },
            ],
            [
                DATA.PAGE_ID_8,
                {
                    annotIds: [],
                    timestamp: DATA.VISITS[DATA.PAGE_ID_8][1].time,
                },
            ],
            [
                DATA.PAGE_ID_10,
                {
                    annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_10][0].url],
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_10
                    ][0].lastEdited.valueOf(),
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_2
                    ][2].lastEdited.valueOf(),
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_5
                    ][0].lastEdited.valueOf(),
                },
            ],
            [
                DATA.PAGE_ID_12,
                {
                    annotIds: [DATA.ANNOTATIONS[DATA.PAGE_ID_12][0].url],
                    timestamp: DATA.ANNOTATIONS[
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_9
                    ][2].lastEdited.valueOf(),
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_4
                    ][0].lastEdited.valueOf(),
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_7
                    ][3].lastEdited.valueOf(),
                },
            ],
            [
                DATA.PAGE_ID_6,
                {
                    annotIds: [],
                    timestamp: DATA.VISITS[DATA.PAGE_ID_6][0].time,
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
                    timestamp: DATA.ANNOTATIONS[
                        DATA.PAGE_ID_3
                    ][3].lastEdited.valueOf(),
                },
            ],
            [
                DATA.PAGE_ID_1,
                {
                    annotIds: [],
                    timestamp: DATA.VISITS[DATA.PAGE_ID_1][0].time,
                },
            ],
        ])
        // expect(resultA.oldestResultTimestamp).toBe(false)
    })
})
