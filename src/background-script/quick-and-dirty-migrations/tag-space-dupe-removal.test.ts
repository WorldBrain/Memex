import type StorageManager from '@worldbrain/storex'
import { removeDupeSpaces } from './tag-space-dupe-removal'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'

interface TestSpaceData {
    id: number
    name: string
    createdAt: Date
    hasShareLink?: boolean
}

interface TestEntryData {
    listId: number
    normalizedUrl: string
    collection: 'annotListEntries' | 'pageListEntries'
}

async function insertTestData(
    storageManager: StorageManager,
    testSpaceData: TestSpaceData[],
    testEntries: TestEntryData[] = [],
) {
    for (const data of testSpaceData) {
        await storageManager.collection('customLists').createObject({
            id: data.id,
            name: data.name,
            searchableName: data.name,
            isNestable: true,
            isDeletable: true,
            createdAt: data.createdAt,
        })

        if (data.hasShareLink) {
            await storageManager.collection('sharedListMetadata').createObject({
                localId: data.id,
                remoteId: data.id.toString(),
            })
        }
    }

    for (const data of testEntries) {
        await storageManager.collection(data.collection).createObject({
            listId: data.listId,
            createdAt: new Date(),
            ...(data.collection === 'pageListEntries'
                ? {
                      pageUrl: data.normalizedUrl,
                      fullUrl: 'https://' + data.normalizedUrl,
                  }
                : { url: data.normalizedUrl }),
        })
    }
}

async function setupTest() {
    const setup = await setupBackgroundIntegrationTest()

    return setup
}

describe('duped tag space removal', () => {
    it('should dedupe unshared spaces with the same name, choosing the oldest to keep', async () => {
        const { storageManager } = await setupTest()

        // prettier-ignore
        await insertTestData(storageManager, [
            { id: 1, name: 'test a', createdAt: new  Date('2022-07-04') },
            { id: 2, name: 'test a', createdAt: new  Date('2022-07-05') },
            { id: 3, name: 'test b', createdAt: new  Date('2022-07-04') },
            { id: 4, name: 'test c', createdAt: new  Date('2022-07-04') },
            { id: 5, name: 'test c', createdAt: new  Date('2022-07-05') },
            { id: 6, name: 'test c', createdAt: new  Date('2022-07-03') },
        ])

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
        ])

        await removeDupeSpaces({ storageManager })

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
        ])
    })

    it('should dedupe spaces with the same name, choosing to keep those which have share links', async () => {
        const { storageManager } = await setupTest()

        // prettier-ignore
        await insertTestData(storageManager, [
            { id: 1, name: 'test a', createdAt: new  Date('2022-07-04') },
            { id: 2, name: 'test a', createdAt: new  Date('2022-07-05'), hasShareLink: true },
            { id: 3, name: 'test b', createdAt: new  Date('2022-07-04') },
            { id: 4, name: 'test c', createdAt: new  Date('2022-07-04'), hasShareLink: true },
            { id: 5, name: 'test c', createdAt: new  Date('2022-07-05') },
            { id: 6, name: 'test c', createdAt: new  Date('2022-07-03') },
        ])

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
        ])

        await removeDupeSpaces({ storageManager })

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c', createdAt: new Date('2022-07-04') }),
        ])
    })

    it('should keep all duped spaces which have their own share links, renaming them to indicate they are dupes', async () => {
        const { storageManager } = await setupTest()

        // prettier-ignore
        await insertTestData(storageManager, [
            { id: 1, name: 'test a', createdAt: new  Date('2022-07-04') },
            { id: 2, name: 'test a', createdAt: new  Date('2022-07-05'), hasShareLink: true },
            { id: 3, name: 'test b', createdAt: new  Date('2022-07-04') },
            { id: 4, name: 'test c', createdAt: new  Date('2022-07-04'), hasShareLink: true },
            { id: 5, name: 'test c', createdAt: new  Date('2022-07-05'), hasShareLink: true },
            { id: 6, name: 'test c', createdAt: new  Date('2022-07-03'), hasShareLink: true },
            { id: 7, name: 'test d', createdAt: new  Date('2022-07-04'), hasShareLink: true },
            { id: 8, name: 'test d', createdAt: new  Date('2022-07-05'), },
            { id: 9, name: 'test d', createdAt: new  Date('2022-07-03'), },
            { id: 10, name: 'test d', createdAt: new  Date('2022-07-02'), hasShareLink: true },
        ])

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
            expect.objectContaining({ id: 7, name: 'test d', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 8, name: 'test d', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 9, name: 'test d', createdAt: new Date('2022-07-03') }),
            expect.objectContaining({ id: 10, name: 'test d', createdAt: new Date('2022-07-02') }),
        ])

        await removeDupeSpaces({ storageManager })

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c (duplicate #1)', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c (duplicate #2)', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
            expect.objectContaining({ id: 7, name: 'test d (duplicated #1)', createdAt: new Date('2022-07-03') }),
            expect.objectContaining({ id: 10, name: 'test d', createdAt: new Date('2022-07-03') }),
        ])
    })

    it('should re-point entries pointing at to-be-deleted duped spaces to point to main de-duped space', async () => {
        const { storageManager } = await setupTest()

        // prettier-ignore
        await insertTestData(storageManager, [
            { id: 1, name: 'test a', createdAt: new  Date('2022-07-04'),  },
            { id: 2, name: 'test a', createdAt: new  Date('2022-07-05'), hasShareLink: true },
            { id: 3, name: 'test b', createdAt: new  Date('2022-07-04') },
            { id: 4, name: 'test c', createdAt: new  Date('2022-07-04') },
            { id: 5, name: 'test c', createdAt: new  Date('2022-07-05'), hasShareLink: true },
            { id: 6, name: 'test c', createdAt: new  Date('2022-07-03'), hasShareLink: true },
        ], [
            { listId: 1, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 1, normalizedUrl: 'test.com/b', collection: 'pageListEntries' },
            { listId: 1, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' },
            { listId: 1, normalizedUrl: 'test.com/b#1112', collection: 'annotListEntries' },

            { listId: 2, normalizedUrl: 'test.com/a', collection: 'pageListEntries' }, // this one should be deleted (dupe)
            { listId: 2, normalizedUrl: 'test.com/c', collection: 'pageListEntries' },
            { listId: 2, normalizedUrl: 'test.com/d', collection: 'pageListEntries' },
            { listId: 2, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' }, // this one should be deleted (dupe)
            { listId: 2, normalizedUrl: 'test.com/b#1112', collection: 'annotListEntries' }, // this one should be deleted (dupe)
            { listId: 2, normalizedUrl: 'test.com/d#1113', collection: 'annotListEntries' },
            { listId: 2, normalizedUrl: 'test.com/d#1114', collection: 'annotListEntries' },

            { listId: 3, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 3, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' },

            { listId: 4, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 4, normalizedUrl: 'test.com/c#1113', collection: 'annotListEntries' }, // this one should be deleted (dupe)
            { listId: 4, normalizedUrl: 'test.com/a#1114', collection: 'annotListEntries' },

            { listId: 5, normalizedUrl: 'test.com/c', collection: 'pageListEntries' },
            { listId: 5, normalizedUrl: 'test.com/d', collection: 'pageListEntries' },

            { listId: 6, normalizedUrl: 'test.com/c#1113', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1114', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1115', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1116', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1117', collection: 'annotListEntries' },
        ])

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 4, name: 'test c', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
        ])
        // prettier-ignore
        expect(await storageManager.collection('pageListEntries').findAllObjects({})).toEqual(expect.arrayContaining([
            expect.objectContaining({ listId: 1, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 1, pageUrl: 'test.com/b' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/d' }),
            expect.objectContaining({ listId: 3, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 4, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/d' }),
        ]))
        // prettier-ignore
        expect(await storageManager.collection('annotListEntries').findAllObjects({})).toEqual(expect.arrayContaining([
            expect.objectContaining({ listId: 1, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 1, url: 'test.com/b#1112' }),
            expect.objectContaining({ listId: 2, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 2, url: 'test.com/b#1112' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1113' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 3, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 4, url: 'test.com/c#1113' }),
            expect.objectContaining({ listId: 4, url: 'test.com/a#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/c#1113' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1115' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1116' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1117' }),
        ]))

        await removeDupeSpaces({ storageManager })

        // prettier-ignore
        expect(await storageManager.collection('customLists').findAllObjects({})).toEqual([
            expect.objectContaining({ id: 2, name: 'test a', createdAt: new Date('2022-07-05') }),
            expect.objectContaining({ id: 3, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 5, name: 'test c (duplicate #1)', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 6, name: 'test c', createdAt: new Date('2022-07-03') }),
        ])
        // prettier-ignore
        expect(await storageManager.collection('pageListEntries').findAllObjects({})).toEqual(expect.arrayContaining([
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/b' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/d' }),
            expect.objectContaining({ listId: 3, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 6, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/d' }),
        ]))
        // prettier-ignore
        expect(await storageManager.collection('annotListEntries').findAllObjects({})).toEqual(expect.arrayContaining([
            expect.objectContaining({ listId: 2, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 2, url: 'test.com/b#1112' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1113' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 3, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 6, url: 'test.com/a#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/c#1113' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1115' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1116' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1117' }),
        ]))
    })

    it('should ignore non-dupes', async () => {
        const { storageManager } = await setupTest()

        // prettier-ignore
        await insertTestData(storageManager, [
            { id: 1, name: 'test a', createdAt: new  Date('2022-07-04') },
            { id: 2, name: 'test b', createdAt: new  Date('2022-07-04') },
            { id: 3, name: 'test c', createdAt: new  Date('2022-07-03'), hasShareLink: true },
            { id: 4, name: 'test d', createdAt: new  Date('2022-07-02'), hasShareLink: true },
            { id: 5, name: 'test e', createdAt: new  Date('2022-07-02') },
            { id: 6, name: 'test f', createdAt: new  Date('2022-07-02'), hasShareLink: true },
        ], [
            { listId: 1, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 1, normalizedUrl: 'test.com/b', collection: 'pageListEntries' },
            { listId: 1, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' },
            { listId: 1, normalizedUrl: 'test.com/b#1112', collection: 'annotListEntries' },

            { listId: 2, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 2, normalizedUrl: 'test.com/c', collection: 'pageListEntries' },
            { listId: 2, normalizedUrl: 'test.com/d', collection: 'pageListEntries' },
            { listId: 2, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' },
            { listId: 2, normalizedUrl: 'test.com/b#1112', collection: 'annotListEntries' },
            { listId: 2, normalizedUrl: 'test.com/d#1113', collection: 'annotListEntries' },
            { listId: 2, normalizedUrl: 'test.com/d#1114', collection: 'annotListEntries' },

            { listId: 3, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 3, normalizedUrl: 'test.com/a#1111', collection: 'annotListEntries' },

            { listId: 4, normalizedUrl: 'test.com/a', collection: 'pageListEntries' },
            { listId: 4, normalizedUrl: 'test.com/c#1113', collection: 'annotListEntries' },
            { listId: 4, normalizedUrl: 'test.com/a#1114', collection: 'annotListEntries' },

            { listId: 5, normalizedUrl: 'test.com/c', collection: 'pageListEntries' },
            { listId: 5, normalizedUrl: 'test.com/d', collection: 'pageListEntries' },

            { listId: 6, normalizedUrl: 'test.com/c#1113', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1114', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1115', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1116', collection: 'annotListEntries' },
            { listId: 6, normalizedUrl: 'test.com/d#1117', collection: 'annotListEntries' },
        ])

        // prettier-ignore
        const expectedLists = [
            expect.objectContaining({ id: 1, name: 'test a', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 2, name: 'test b', createdAt: new Date('2022-07-04') }),
            expect.objectContaining({ id: 3, name: 'test c', createdAt: new Date('2022-07-03') }),
            expect.objectContaining({ id: 4, name: 'test d', createdAt: new Date('2022-07-02') }),
            expect.objectContaining({ id: 5, name: 'test e', createdAt: new Date('2022-07-02') }),
            expect.objectContaining({ id: 6, name: 'test f', createdAt: new Date('2022-07-02') }),
        ]
        const expectedPageEntries = expect.arrayContaining([
            expect.objectContaining({ listId: 1, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 1, pageUrl: 'test.com/b' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 2, pageUrl: 'test.com/d' }),
            expect.objectContaining({ listId: 3, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 4, pageUrl: 'test.com/a' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/c' }),
            expect.objectContaining({ listId: 5, pageUrl: 'test.com/d' }),
        ])
        const expectedAnnotEntries = expect.arrayContaining([
            expect.objectContaining({ listId: 1, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 1, url: 'test.com/b#1112' }),
            expect.objectContaining({ listId: 2, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 2, url: 'test.com/b#1112' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1113' }),
            expect.objectContaining({ listId: 2, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 3, url: 'test.com/a#1111' }),
            expect.objectContaining({ listId: 4, url: 'test.com/c#1113' }),
            expect.objectContaining({ listId: 4, url: 'test.com/a#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/c#1113' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1114' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1115' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1116' }),
            expect.objectContaining({ listId: 6, url: 'test.com/d#1117' }),
        ])

        expect(
            await storageManager.collection('customLists').findAllObjects({}),
        ).toEqual(expectedLists)
        expect(
            await storageManager
                .collection('pageListEntries')
                .findAllObjects({}),
        ).toEqual(expectedPageEntries)
        expect(
            await storageManager
                .collection('annotListEntries')
                .findAllObjects({}),
        ).toEqual(expectedAnnotEntries)

        await removeDupeSpaces({ storageManager })

        expect(
            await storageManager.collection('customLists').findAllObjects({}),
        ).toEqual(expectedLists)
        expect(
            await storageManager
                .collection('pageListEntries')
                .findAllObjects({}),
        ).toEqual(expectedPageEntries)
        expect(
            await storageManager
                .collection('annotListEntries')
                .findAllObjects({}),
        ).toEqual(expectedAnnotEntries)
    })
})
