import { createMemexReconciliationProcessor } from '@worldbrain/memex-common/lib/sync/reconciliation'
import {
    SPECIAL_LIST_IDS,
    SPECIAL_LIST_NAMES,
} from '@worldbrain/memex-storage/lib/lists/constants'
import { OperationBatch } from '@worldbrain/storex'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

async function setupTest() {
    const { storageManager } = await setupBackgroundIntegrationTest()

    const reconcilationProcessor = createMemexReconciliationProcessor(
        storageManager,
    )

    return { storageManager, reconcilationProcessor }
}

describe('Sync extension reconciliation tests', () => {
    it('should be able to re-point list entries pointing to a non-existent list to the saved-on-mobile list', async () => {
        const { reconcilationProcessor, storageManager } = await setupTest()

        await storageManager.collection('customLists').createObject({
            id: SPECIAL_LIST_IDS.MOBILE,
            name: SPECIAL_LIST_NAMES.MOBILE,
            searchableName: SPECIAL_LIST_NAMES.MOBILE,
            isDeletable: false,
            isNestable: false,
            createdAt: new Date(),
        })
        await storageManager.collection('customLists').createObject({
            id: 100,
            name: 'test list',
            searchableName: 'test list',
            isDeletable: false,
            isNestable: false,
            createdAt: new Date(),
        })

        const dummyDate = new Date()

        const preReconciliationBatch: OperationBatch = [
            {
                collection: 'pageListEntries',
                operation: 'deleteObjects',
                where: { pageUrl: 'test.com/0' },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    pageUrl: 'test.com/1',
                    fullUrl: 'https://test.com/1',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: 11111, // This should not exist
                    pageUrl: 'test.com/1',
                    fullUrl: 'https://test.com/1',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: 11112, // This should not exist
                    pageUrl: 'test.com/2',
                    fullUrl: 'https://test.com/2',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: 100, // This should exist
                    pageUrl: 'test.com/2',
                    fullUrl: 'https://test.com/2',
                    createdAt: dummyDate,
                },
            },
        ]

        const postReconciliationBatch = await reconcilationProcessor(
            preReconciliationBatch,
        )

        expect(postReconciliationBatch).toEqual([
            {
                collection: 'pageListEntries',
                operation: 'deleteObjects',
                where: { pageUrl: 'test.com/0' },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    pageUrl: 'test.com/1',
                    fullUrl: 'https://test.com/1',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    pageUrl: 'test.com/1',
                    fullUrl: 'https://test.com/1',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: SPECIAL_LIST_IDS.MOBILE,
                    pageUrl: 'test.com/2',
                    fullUrl: 'https://test.com/2',
                    createdAt: dummyDate,
                },
            },
            {
                collection: 'pageListEntries',
                operation: 'createObject',
                args: {
                    listId: 100, // This should exist
                    pageUrl: 'test.com/2',
                    fullUrl: 'https://test.com/2',
                    createdAt: dummyDate,
                },
            },
        ])
    })
})
