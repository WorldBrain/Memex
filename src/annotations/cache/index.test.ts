import { PageAnnotationDeps, PageAnnotationsCache } from '.'
import * as TEST_DATA from './index.test.data'
import type { UnifiedList, PageAnnotationsCacheEvents } from './types'

type EmittedEvent = { event: keyof PageAnnotationsCacheEvents; args: any }

function setupTest(deps: Partial<PageAnnotationDeps> = {}) {
    const emittedEvents: EmittedEvent[] = []
    const cache = new PageAnnotationsCache({
        sortingFn: () => 0,
        normalizedPageUrl: TEST_DATA.NORMALIZED_PAGE_URL_1,
        events: {
            emit: (event: keyof PageAnnotationsCacheEvents, args: any) =>
                emittedEvents.push({ event, args }),
        } as any,
        ...deps,
    })

    return { cache, emittedEvents }
}

describe('Page annotations cache tests', () => {
    it('should be able to add, remove, and update annotations to/from/in the cache', () => {
        const { cache, emittedEvents } = setupTest()
        const expectedEvents: EmittedEvent[] = []

        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idA } = cache.addAnnotation(TEST_DATA.ANNOTATIONS[0])
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...TEST_DATA.ANNOTATIONS[0], unifiedId: idA },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...TEST_DATA.ANNOTATIONS[0], unifiedId: idA },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idB } = cache.addAnnotation(TEST_DATA.ANNOTATIONS[1])
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...TEST_DATA.ANNOTATIONS[1], unifiedId: idB },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idB, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...TEST_DATA.ANNOTATIONS[0], unifiedId: idA },
            [idB]: { ...TEST_DATA.ANNOTATIONS[1], unifiedId: idB },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idC } = cache.addAnnotation(TEST_DATA.ANNOTATIONS[2])
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...TEST_DATA.ANNOTATIONS[2], unifiedId: idC },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idB, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...TEST_DATA.ANNOTATIONS[0], unifiedId: idA },
            [idB]: { ...TEST_DATA.ANNOTATIONS[1], unifiedId: idB },
            [idC]: { ...TEST_DATA.ANNOTATIONS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeAnnotation({ unifiedId: idB })
        expectedEvents.push({
            event: 'removedAnnotation',
            args: { ...TEST_DATA.ANNOTATIONS[1], unifiedId: idB },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...TEST_DATA.ANNOTATIONS[0], unifiedId: idA },
            [idC]: { ...TEST_DATA.ANNOTATIONS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedAnnotationA = {
            ...TEST_DATA.ANNOTATIONS[0],
            unifiedId: idA,
            comment: 'updated comment',
            isShared: true,
            isBulkShareProtected: true,
        }
        cache.updateAnnotation(updatedAnnotationA)
        expectedEvents.push({
            event: 'updatedAnnotation',
            args: updatedAnnotationA,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: updatedAnnotationA,
            [idC]: { ...TEST_DATA.ANNOTATIONS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const now = Date.now()
        const updatedAnnotationC = {
            ...TEST_DATA.ANNOTATIONS[2],
            unifiedId: idC,
            isShared: false,
            lastEdited: now,
        }
        cache.updateAnnotation(updatedAnnotationC, {
            updateLastEditedTimestamp: true,
            now,
        })
        expectedEvents.push({
            event: 'updatedAnnotation',
            args: updatedAnnotationC,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: updatedAnnotationA,
            [idC]: updatedAnnotationC,
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeAnnotation(updatedAnnotationC)
        expectedEvents.push({
            event: 'removedAnnotation',
            args: updatedAnnotationC,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: updatedAnnotationA,
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeAnnotation(updatedAnnotationA)
        expectedEvents.push({
            event: 'removedAnnotation',
            args: updatedAnnotationA,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should be able to reset page URL and annotations in the cache', () => {
        const { cache, emittedEvents } = setupTest({
            normalizedPageUrl: TEST_DATA.NORMALIZED_PAGE_URL_1,
        })
        const expectedEvents: EmittedEvent[] = []

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_1)
        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsA } = cache.setAnnotations(
            TEST_DATA.NORMALIZED_PAGE_URL_1,
            TEST_DATA.ANNOTATIONS.slice(1, 3),
        )
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_1)
        expect(cache.annotations.allIds).toEqual(unifiedIdsA)
        expect(cache.annotations.byId).toEqual({
            [unifiedIdsA[0]]: {
                ...TEST_DATA.ANNOTATIONS[1],
                unifiedId: unifiedIdsA[0],
            },
            [unifiedIdsA[1]]: {
                ...TEST_DATA.ANNOTATIONS[2],
                unifiedId: unifiedIdsA[1],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsB } = cache.setAnnotations(
            TEST_DATA.NORMALIZED_PAGE_URL_2,
            TEST_DATA.ANNOTATIONS,
        )
        expectedEvents.push({
            event: 'updatedPageUrl',
            args: cache.normalizedPageUrl,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_2)
        expect(cache.annotations.allIds).toEqual(unifiedIdsB)
        expect(cache.annotations.byId).toEqual({
            [unifiedIdsB[0]]: {
                ...TEST_DATA.ANNOTATIONS[0],
                unifiedId: unifiedIdsB[0],
            },
            [unifiedIdsB[1]]: {
                ...TEST_DATA.ANNOTATIONS[1],
                unifiedId: unifiedIdsB[1],
            },
            [unifiedIdsB[2]]: {
                ...TEST_DATA.ANNOTATIONS[2],
                unifiedId: unifiedIdsB[2],
            },
            [unifiedIdsB[3]]: {
                ...TEST_DATA.ANNOTATIONS[3],
                unifiedId: unifiedIdsB[3],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should be able to add, remove, and update lists to/from/in the cache', () => {
        const { cache, emittedEvents } = setupTest()
        const expectedEvents: EmittedEvent[] = []

        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idA } = cache.addList(TEST_DATA.LISTS[0])
        expectedEvents.push({
            event: 'addedList',
            args: { ...TEST_DATA.LISTS[0], unifiedId: idA },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...TEST_DATA.LISTS[0], unifiedId: idA },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idB } = cache.addList(TEST_DATA.LISTS[1])
        expectedEvents.push({
            event: 'addedList',
            args: { ...TEST_DATA.LISTS[1], unifiedId: idB },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idB, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...TEST_DATA.LISTS[0], unifiedId: idA },
            [idB]: { ...TEST_DATA.LISTS[1], unifiedId: idB },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idC } = cache.addList(TEST_DATA.LISTS[2])
        expectedEvents.push({
            event: 'addedList',
            args: { ...TEST_DATA.LISTS[2], unifiedId: idC },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idB, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...TEST_DATA.LISTS[0], unifiedId: idA },
            [idB]: { ...TEST_DATA.LISTS[1], unifiedId: idB },
            [idC]: { ...TEST_DATA.LISTS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeList({ unifiedId: idB })
        expectedEvents.push({
            event: 'removedList',
            args: { ...TEST_DATA.LISTS[1], unifiedId: idB },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...TEST_DATA.LISTS[0], unifiedId: idA },
            [idC]: { ...TEST_DATA.LISTS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedListA: UnifiedList = {
            ...TEST_DATA.LISTS[0],
            name: 'new list name',
        }
        cache.updateList(updatedListA)
        expectedEvents.push({ event: 'updatedList', args: updatedListA })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: updatedListA,
            [idC]: { ...TEST_DATA.LISTS[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedListC: UnifiedList = {
            ...TEST_DATA.LISTS[2],
            description: 'new list description',
        }
        cache.updateList(updatedListC)
        expectedEvents.push({ event: 'updatedList', args: updatedListC })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: updatedListA,
            [idC]: updatedListC,
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeList(updatedListC)
        expectedEvents.push({ event: 'removedList', args: updatedListC })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idA])
        expect(cache.lists.byId).toEqual({
            [idA]: updatedListA,
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeList(updatedListA)
        expectedEvents.push({ event: 'removedList', args: updatedListA })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should be able to reset lists in the cache', () => {
        const { cache, emittedEvents } = setupTest()
        const expectedEvents: EmittedEvent[] = []

        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsA } = cache.setLists(
            TEST_DATA.LISTS.slice(0, 1),
        )
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual(unifiedIdsA)
        expect(cache.lists.byId).toEqual({
            [unifiedIdsA[0]]: {
                ...TEST_DATA.LISTS[0],
                unifiedId: unifiedIdsA[0],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsB } = cache.setLists(
            TEST_DATA.LISTS.slice(1),
        )
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual(unifiedIdsB)
        expect(cache.lists.byId).toEqual({
            [unifiedIdsB[0]]: {
                ...TEST_DATA.LISTS[1],
                unifiedId: unifiedIdsB[0],
            },
            [unifiedIdsB[1]]: {
                ...TEST_DATA.LISTS[2],
                unifiedId: unifiedIdsB[1],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should be able to find annotations and lists in the cache via both their local and remote IDs', () => {
        const { cache } = setupTest()

        const { unifiedIds: unifiedListIds } = cache.setLists(TEST_DATA.LISTS)
        const { unifiedIds: unifiedAnnotationIds } = cache.setAnnotations(
            TEST_DATA.NORMALIZED_PAGE_URL_1,
            TEST_DATA.ANNOTATIONS,
        )

        expect(
            cache.getAnnotationByLocalId(TEST_DATA.ANNOTATIONS[0].localId),
        ).toEqual({
            ...TEST_DATA.ANNOTATIONS[0],
            unifiedId: unifiedAnnotationIds[0],
        })
        expect(
            cache.getAnnotationByLocalId(TEST_DATA.ANNOTATIONS[1].localId),
        ).toEqual({
            ...TEST_DATA.ANNOTATIONS[1],
            unifiedId: unifiedAnnotationIds[1],
        })
        expect(
            cache.getAnnotationByRemoteId(TEST_DATA.ANNOTATIONS[1].remoteId),
        ).toEqual({
            ...TEST_DATA.ANNOTATIONS[1],
            unifiedId: unifiedAnnotationIds[1],
        })
        expect(
            cache.getAnnotationByRemoteId(TEST_DATA.ANNOTATIONS[3].remoteId),
        ).toEqual({
            ...TEST_DATA.ANNOTATIONS[3],
            unifiedId: unifiedAnnotationIds[3],
        })

        expect(cache.getListByLocalId(TEST_DATA.LISTS[0].localId)).toEqual({
            ...TEST_DATA.LISTS[0],
            unifiedId: unifiedListIds[0],
        })
        expect(cache.getListByLocalId(TEST_DATA.LISTS[1].localId)).toEqual({
            ...TEST_DATA.LISTS[1],
            unifiedId: unifiedListIds[1],
        })
        expect(cache.getListByRemoteId(TEST_DATA.LISTS[1].remoteId)).toEqual({
            ...TEST_DATA.LISTS[1],
            unifiedId: unifiedListIds[1],
        })
        expect(cache.getListByRemoteId(TEST_DATA.LISTS[2].remoteId)).toEqual({
            ...TEST_DATA.LISTS[2],
            unifiedId: unifiedListIds[2],
        })

        expect(
            cache.getAnnotationByLocalId(TEST_DATA.ANNOTATIONS[1].remoteId),
        ).toEqual(null)
        expect(
            cache.getAnnotationByRemoteId(TEST_DATA.ANNOTATIONS[1].localId),
        ).toEqual(null)
        expect(cache.getAnnotationByLocalId('I dont exist')).toEqual(null)
        expect(cache.getAnnotationByRemoteId('I dont exist')).toEqual(null)
        expect(cache.getListByLocalId(1231231233123)).toEqual(null)
        expect(cache.getListByRemoteId('I dont exist')).toEqual(null)
    })
})
