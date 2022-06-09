import type Dexie from 'dexie'
import type { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'
import { isUrlForAnnotation } from '@worldbrain/memex-common/lib/annotations/utils'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { migrateTagsToSpaces } from './tags-migration'
import * as DATA from './tags-migration.test.data'

async function setupTest() {
    const setup = await setupBackgroundIntegrationTest()

    return {
        dexie: (setup.storageManager.backend as DexieStorageBackend)
            .dexieInstance,
        ...setup,
    }
}

async function testMigration(
    dexie: Dexie,
    tagsDataSet: Array<{ url: string; name: string }>,
    chunkSize = 50,
) {
    await dexie.table('tags').bulkAdd(tagsDataSet)
    const queuedData = new Map<string, any[]>()

    expect(await dexie.table('customLists').toArray()).toEqual([])
    expect(await dexie.table('pageListEntries').toArray()).toEqual([])
    expect(await dexie.table('annotListEntries').toArray()).toEqual([])
    expect(queuedData.get('customLists')).toBeUndefined()
    expect(queuedData.get('pageListEntries')).toBeUndefined()
    expect(queuedData.get('annotListEntries')).toBeUndefined()

    await migrateTagsToSpaces({
        dexie,
        chunkSize,
        queueChangesForCloudSync: async (data) => {
            const prev = queuedData.get(data.collection) ?? []
            queuedData.set(data.collection, [...prev, ...data.objs])
        },
    })
    const tagNames = new Set<string>(tagsDataSet.map((tag) => tag.name))

    const listsData = await dexie.table('customLists').toArray()
    const expectedListsData = [...tagNames].map((tagName) => ({
        id: expect.any(Number),
        name: tagName,
        isNestable: true,
        isDeletable: true,
        searchableName: tagName,
        createdAt: expect.any(Date),
        nameTerms: expect.any(Array),
    }))
    expect(listsData).toEqual(expect.arrayContaining(expectedListsData))
    expect(queuedData.get('customLists')).toEqual(
        expect.arrayContaining(expectedListsData),
    )

    const tagNamesToListId = new Map<string, number>()
    listsData.forEach((list) => tagNamesToListId.set(list.name, list.id))

    const expectedPageListEntryData = tagsDataSet
        .filter((entry) => !isUrlForAnnotation(entry.url))
        .map((entry) => ({
            pageUrl: entry.url,
            fullUrl: 'https://' + entry.url,
            listId: tagNamesToListId.get(entry.name),
            createdAt: expect.any(Date),
        }))
    const expectedAnnotListEntryData = tagsDataSet
        .filter((entry) => isUrlForAnnotation(entry.url))
        .map((entry) => ({
            url: entry.url,
            listId: tagNamesToListId.get(entry.name),
            createdAt: expect.any(Date),
        }))

    expect(await dexie.table('pageListEntries').toArray()).toEqual(
        expect.arrayContaining(expectedPageListEntryData),
    )
    expect(await dexie.table('annotListEntries').toArray()).toEqual(
        expect.arrayContaining(expectedAnnotListEntryData),
    )
    expect(queuedData.get('pageListEntries')).toEqual(
        expect.arrayContaining(expectedPageListEntryData),
    )
    expect(queuedData.get('annotListEntries')).toEqual(
        expect.arrayContaining(expectedAnnotListEntryData),
    )
}

describe('tags to spaces data migration', () => {
    it('should create "customLists" records for all distinct tag names + "pageListEntries" and "annotListEntries" records for all tag records', async () => {
        const { dexie: dexieA } = await setupTest()
        await testMigration(
            dexieA,
            DATA.createTestTagRecords({
                numOfTags: 5,
                pagesPerTag: 5,
                annotsPerPage: 5,
            }),
        )

        const { dexie: dexieB } = await setupTest()
        await testMigration(
            dexieB,
            DATA.createTestTagRecords({
                numOfTags: 50,
                pagesPerTag: 1,
                annotsPerPage: 5,
            }),
        )
    })

    it('should still work with a large number of chunks', async () => {
        const { dexie: dexieA } = await setupTest()
        await testMigration(
            dexieA,
            DATA.createTestTagRecords({
                numOfTags: 5,
                pagesPerTag: 5,
                annotsPerPage: 5,
            }),
            5,
        )
    })

    it('should still work with duplicate space entries (not throw Dexie.BulkError on Dexie.bulkAdd)', async () => {
        const { dexie: dexieA } = await setupTest()
        const tagsDataSet = DATA.createTestTagRecords({
            numOfTags: 5,
            pagesPerTag: 5,
            annotsPerPage: 5,
        })
        await dexieA.table('tags').bulkAdd(tagsDataSet)

        await dexieA.table('customLists').add({
            id: 111,
            name: tagsDataSet[0].name,
            createdAt: new Date(),
            searchableName: tagsDataSet[0].name,
            nameTerms: [],
            isDeletable: true,
            isNestable: true,
        })

        // This entry will be duplicated via the migration logic
        await dexieA.table('pageListEntries').add({
            listId: 111,
            pageUrl: tagsDataSet[0].url,
            fullUrl: 'https://' + tagsDataSet[0].url,
            createdAt: new Date(),
        })

        await migrateTagsToSpaces({
            dexie: dexieA,
            chunkSize: 50,
            queueChangesForCloudSync: async (data) => {},
        })
    })

    it('should still work without pages and without annotations', async () => {
        const { dexie: dexieA } = await setupTest()
        await testMigration(
            dexieA,
            DATA.createTestTagRecords({
                numOfTags: 10,
                pagesPerTag: 5,
                annotsPerPage: 0,
            }),
        )
        const { dexie: dexieB } = await setupTest()
        await testMigration(
            dexieB,
            DATA.createTestTagRecords({
                numOfTags: 100,
                pagesPerTag: 0,
                annotsPerPage: 0,
            }),
        )
    })

    it('should add entries to existing lists, if tag names overlap', async () => {
        const { dexie } = await setupTest()

        const tagsDataSet = DATA.createTestTagRecords({
            numOfTags: 5,
            pagesPerTag: 5,
            annotsPerPage: 5,
        })

        const existingListNames = [tagsDataSet[0].name, tagsDataSet[4].name]

        await dexie.table('tags').bulkAdd(tagsDataSet)
        const queuedData = new Map<string, any[]>()

        await dexie.table('customLists').bulkAdd(
            existingListNames.map((name, i) => ({
                id: i,
                createdAt: new Date(i),
                name,
                searchableName: name,
                nameTerms: [],
                isDeletable: true,
                isNestable: true,
            })),
        )

        await migrateTagsToSpaces({
            dexie,
            chunkSize: 50,
            queueChangesForCloudSync: async (data) => {
                const prev = queuedData.get(data.collection) ?? []
                queuedData.set(data.collection, [...prev, ...data.objs])
            },
        })
        const tagNames = new Set<string>(tagsDataSet.map((tag) => tag.name))

        expect(
            await dexie
                .table('customLists')
                .where('name')
                .anyOf(existingListNames)
                .primaryKeys(),
        ).toEqual([0, 1])

        const listsData = await dexie.table('customLists').toArray()
        const expectedListsData = [...tagNames].map((tagName) => ({
            id: expect.any(Number),
            name: tagName,
            isNestable: true,
            isDeletable: true,
            searchableName: tagName,
            createdAt: expect.any(Date),
            nameTerms: expect.any(Array),
        }))
        expect(listsData).toEqual(expect.arrayContaining(expectedListsData))
        expect(queuedData.get('customLists')).toEqual(
            expect.arrayContaining(
                expectedListsData.filter(
                    (list) => !existingListNames.includes(list.name),
                ),
            ),
        )

        const tagNamesToListId = new Map<string, number>()
        listsData.forEach((list) => tagNamesToListId.set(list.name, list.id))

        const expectedPageListEntryData = tagsDataSet
            .filter((entry) => !isUrlForAnnotation(entry.url))
            .map((entry) => ({
                pageUrl: entry.url,
                fullUrl: 'https://' + entry.url,
                listId: tagNamesToListId.get(entry.name),
                createdAt: expect.any(Date),
            }))
        const expectedAnnotListEntryData = tagsDataSet
            .filter((entry) => isUrlForAnnotation(entry.url))
            .map((entry) => ({
                url: entry.url,
                listId: tagNamesToListId.get(entry.name),
                createdAt: expect.any(Date),
            }))

        expect(await dexie.table('pageListEntries').toArray()).toEqual(
            expect.arrayContaining(expectedPageListEntryData),
        )
        expect(await dexie.table('annotListEntries').toArray()).toEqual(
            expect.arrayContaining(expectedAnnotListEntryData),
        )
        expect(queuedData.get('pageListEntries')).toEqual(
            expect.arrayContaining(expectedPageListEntryData),
        )
        expect(queuedData.get('annotListEntries')).toEqual(
            expect.arrayContaining(expectedAnnotListEntryData),
        )
    })
})
