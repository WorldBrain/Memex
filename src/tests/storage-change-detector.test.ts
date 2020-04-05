import expect from 'expect'
import StorageManager, { CollectionDefinitionMap } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import inMemory from '@worldbrain/storex-backend-dexie/lib/in-memory'
import { StorageChangeDetector } from './storage-change-detector'

const DEFAULT_COLLECTION_DEFINITIONS: CollectionDefinitionMap = {
    page: {
        version: new Date(1),
        fields: {
            url: { type: 'string' },
            title: { type: 'string', optional: true },
        },
    },
}

async function setupTest(options?: {
    collections: CollectionDefinitionMap
    toTrack?: string[]
}) {
    const storageBackend = new DexieStorageBackend({
        dbName: 'test',
        idbImplementation: inMemory(),
        legacyMemexCompatibility: true,
    })
    const storageManager = new StorageManager({ backend: storageBackend })
    const collectionDefinitions =
        (options && options.collections) || DEFAULT_COLLECTION_DEFINITIONS
    storageManager.registry.registerCollections(collectionDefinitions)
    await storageManager.finishInitialization()

    const changeDetector = new StorageChangeDetector({
        storageManager,
        toTrack:
            (options && options.toTrack) || Object.keys(collectionDefinitions),
    })
    return { storageManager, changeDetector }
}

describe('Storage change detector for tests', () => {
    it('should correctly detect creations', async () => {
        const { storageManager, changeDetector } = await setupTest()
        await changeDetector.capture()

        const url = 'http://test.com'
        const title = 'Test page'
        const pageId = (
            await storageManager.collection('page').createObject({
                url,
                title,
            })
        ).object.id
        expect(await changeDetector.compare()).toEqual({
            page: {
                [pageId]: {
                    type: 'create',
                    object: {
                        id: pageId,
                        url,
                        title,
                    },
                },
            },
        })
    })

    it('should correctly detect updates', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const url = 'http://test.com'
        const firstTitle = 'Test page'
        const pageId = (
            await storageManager.collection('page').createObject({
                url,
                title: firstTitle,
            })
        ).object.id

        await changeDetector.capture()

        const secondTitle = 'Updated page title'
        await storageManager.collection('page').updateObjects(
            { id: pageId },
            {
                url,
                title: secondTitle,
            },
        )

        expect(await changeDetector.compare()).toEqual({
            page: {
                [pageId]: {
                    type: 'modify',
                    updates: {
                        title: secondTitle,
                    },
                },
            },
        })
    })

    it('should correctly detect updating a previously absent optional field', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const url = 'http://test.com'
        const pageId = (
            await storageManager.collection('page').createObject({
                url,
            })
        ).object.id

        await changeDetector.capture()

        const secondTitle = 'Updated page title'
        await storageManager.collection('page').updateObjects(
            { id: pageId },
            {
                url,
                title: secondTitle,
            },
        )

        expect(await changeDetector.compare()).toEqual({
            page: {
                [pageId]: {
                    type: 'modify',
                    updates: {
                        title: secondTitle,
                    },
                },
            },
        })
    })

    it('should correctly detect removal of fields', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const url = 'http://test.com'
        const firstTitle = 'Test page'
        const pageId = (
            await storageManager.collection('page').createObject({
                url,
                title: firstTitle,
            })
        ).object.id

        await changeDetector.capture()

        const secondTitle = undefined
        await storageManager.collection('page').updateObjects(
            { id: pageId },
            {
                url,
                title: secondTitle,
            },
        )

        expect(await changeDetector.compare()).toEqual({
            page: {
                [pageId]: {
                    type: 'modify',
                    updates: {
                        title: secondTitle,
                    },
                },
            },
        })
    })

    it('should correctly detect deletions', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const url = 'http://test.com'
        const firstTitle = 'Test page'
        const pageId = (
            await storageManager.collection('page').createObject({
                url,
                title: firstTitle,
            })
        ).object.id

        await changeDetector.capture()
        await storageManager.collection('page').deleteObjects({ id: pageId })

        expect(await changeDetector.compare()).toEqual({
            page: {
                [pageId]: {
                    type: 'delete',
                },
            },
        })
    })

    it('should correctly detect unintended updates (query too wide)', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const firstPageId = (
            await storageManager.collection('page').createObject({
                url: 'first-url',
                title: 'first-title',
            })
        ).object.id

        const secondPageId = (
            await storageManager.collection('page').createObject({
                url: 'second-url',
                title: 'second-title',
            })
        ).object.id

        await changeDetector.capture()

        await storageManager.collection('page').updateObjects(
            {},
            {
                title: 'third-title',
            },
        )

        expect(await changeDetector.compare()).toEqual({
            page: {
                [firstPageId]: {
                    type: 'modify',
                    updates: {
                        title: 'third-title',
                    },
                },
                [secondPageId]: {
                    type: 'modify',
                    updates: {
                        title: 'third-title',
                    },
                },
            },
        })
    })

    it('should correctly detect unintended deletions (query too wide)', async () => {
        const { storageManager, changeDetector } = await setupTest()

        const firstPageId = (
            await storageManager.collection('page').createObject({
                url: 'first-url',
                title: 'first-title',
            })
        ).object.id

        const secondPageId = (
            await storageManager.collection('page').createObject({
                url: 'second-url',
                title: 'second-title',
            })
        ).object.id

        await changeDetector.capture()

        await storageManager.collection('page').deleteObjects({})

        expect(await changeDetector.compare()).toEqual({
            page: {
                [firstPageId]: {
                    type: 'delete',
                },
                [secondPageId]: {
                    type: 'delete',
                },
            },
        })
    })

    it('should work with compound primary keys', async () => {
        const { storageManager, changeDetector } = await setupTest({
            collections: {
                page: {
                    version: new Date(1),
                    fields: {
                        url: { type: 'string' },
                        title: { type: 'string' },
                    },
                    indices: [{ field: ['url', 'title'], pk: true }],
                },
            },
        })
        await changeDetector.capture()

        const url = 'test.com'
        const title = 'test-page'
        await storageManager.collection('page').createObject({
            url,
            title,
        })
        expect(await changeDetector.compare()).toEqual({
            page: {
                '["test.com","test-page"]': {
                    type: 'create',
                    object: {
                        url,
                        title,
                    },
                },
            },
        })
    })
})
