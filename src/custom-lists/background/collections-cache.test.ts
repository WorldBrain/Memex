import { CollectionCache, PageList, CollectionStatus } from './types'

const TEST_DATA: PageList[] = [
    {
        id: 0,
        name: 'test-0',
        isFollowed: false,
        isCollaborative: false,
    },
    {
        id: 1,
        name: 'test-1',
        isFollowed: false,
        isCollaborative: false,
    },
    {
        id: 2,
        name: 'test-2',
        isFollowed: false,
        isCollaborative: true,
    },
    {
        id: 3,
        name: 'test-3',
        isFollowed: true,
        isCollaborative: false,
    },
    {
        id: 4,
        name: 'test-4',
        isFollowed: true,
        isCollaborative: true,
    },
]

function setupTest(): { cache: CollectionCache } {
    return { cache: {} as CollectionCache }
}

describe('collections cache tests', () => {
    it('should be able to get status for a collection id', () => {
        const { cache } = setupTest()

        for (const listData of TEST_DATA) {
            expect(cache.getCollectionStatus(listData.id)).toEqual({
                isOwn: !listData.isFollowed,
                isCollaborative: listData.isCollaborative,
            })
        }
    })

    it('should be able to get collections by status', () => {
        const { cache } = setupTest()

        expect(
            cache.getCollectionsByStatus({
                isOwn: true,
                isCollaborative: false,
            }),
        ).toEqual([...TEST_DATA.slice(0, 2)])
        expect(
            cache.getCollectionsByStatus({
                isOwn: true,
                isCollaborative: true,
            }),
        ).toEqual([...TEST_DATA.slice(2, 3)])
        expect(
            cache.getCollectionsByStatus({
                isOwn: true,
                isCollaborative: false,
            }),
        ).toEqual([TEST_DATA.slice(3, 4)])
        expect(
            cache.getCollectionsByStatus({
                isOwn: false,
                isCollaborative: true,
            }),
        ).toEqual([TEST_DATA.slice(4, 5)])
    })
})
