import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import { PageAnnotationCacheDeps, PageAnnotationsCache } from '.'
import * as TEST_DATA from './index.test.data'
import type {
    UnifiedList,
    PageAnnotationsCacheEvents,
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
} from './types'

type EmittedEvent = { event: keyof PageAnnotationsCacheEvents; args: any }

const reshapeUnifiedAnnotForCaching = (
    annot: UnifiedAnnotation,
    lists: UnifiedList[],
): UnifiedAnnotationForCache => ({
    ...annot,
    localListIds: annot.unifiedListIds
        .map(
            (unifiedListId) =>
                lists.find((list) => list.unifiedId === unifiedListId)
                    ?.localId ?? null,
        )
        .filter((localListId) => localListId != null),
})

const reshapeUnifiedAnnotsForCaching = (
    annots: UnifiedAnnotation[],
    lists: UnifiedList[],
): UnifiedAnnotationForCache[] =>
    annots.map((annot) => reshapeUnifiedAnnotForCaching(annot, lists))

function setupTest(deps: Partial<PageAnnotationCacheDeps> = {}) {
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
        const testAnnotations = TEST_DATA.ANNOTATIONS()
        const testLists = TEST_DATA.LISTS()

        cache.setLists(testLists)
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idA } = cache.addAnnotation(
            reshapeUnifiedAnnotForCaching(testAnnotations[0], testLists),
        )
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...testAnnotations[0], unifiedId: idA },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...testAnnotations[0], unifiedId: idA },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idB } = cache.addAnnotation(
            reshapeUnifiedAnnotForCaching(testAnnotations[1], testLists),
        )
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...testAnnotations[1], unifiedId: idB },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idB, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...testAnnotations[0], unifiedId: idA },
            [idB]: { ...testAnnotations[1], unifiedId: idB },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idC } = cache.addAnnotation(
            reshapeUnifiedAnnotForCaching(testAnnotations[2], testLists),
        )
        expectedEvents.push({
            event: 'addedAnnotation',
            args: { ...testAnnotations[2], unifiedId: idC },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idB, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...testAnnotations[0], unifiedId: idA },
            [idB]: { ...testAnnotations[1], unifiedId: idB },
            [idC]: { ...testAnnotations[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeAnnotation({ unifiedId: idB })
        expectedEvents.push({
            event: 'removedAnnotation',
            args: { ...testAnnotations[1], unifiedId: idB },
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: { ...testAnnotations[0], unifiedId: idA },
            [idC]: { ...testAnnotations[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedAnnotationA = {
            ...testAnnotations[0],
            unifiedId: idA,
            comment: 'updated comment',
            privacyLevel: AnnotationPrivacyLevels.SHARED_PROTECTED,
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
            [idC]: { ...testAnnotations[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const now = Date.now()
        const updatedAnnotationC = {
            ...testAnnotations[2],
            unifiedId: idC,
            privacyLevel: AnnotationPrivacyLevels.PRIVATE,
            lastEdited: now,
        }
        const expectedAnnotationC = {
            ...updatedAnnotationC,
            unifiedListIds: [], // We're making it private, so this shared list should get dropped
        }
        cache.updateAnnotation(updatedAnnotationC, {
            updateLastEditedTimestamp: true,
            now,
        })
        expectedEvents.push({
            event: 'updatedAnnotation',
            args: expectedAnnotationC,
        })
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.annotations.allIds).toEqual([idC, idA])
        expect(cache.annotations.byId).toEqual({
            [idA]: updatedAnnotationA,
            [idC]: expectedAnnotationC,
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeAnnotation(updatedAnnotationC)
        expectedEvents.push({
            event: 'removedAnnotation',
            args: expectedAnnotationC,
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

    it('updating annotation privacy levels should change lists', () => {
        // TODO: This functionality currently tested in sidebar logic tests. Should move to here (see: 'privacy level state changes')
        expect(true).toBe(true)
    })

    it('should be able to reset page URL and annotations in the cache', () => {
        const { cache, emittedEvents } = setupTest({
            normalizedPageUrl: TEST_DATA.NORMALIZED_PAGE_URL_1,
        })
        const expectedEvents: EmittedEvent[] = []
        const testAnnotations = TEST_DATA.ANNOTATIONS()
        const testLists = TEST_DATA.LISTS()

        cache.setLists(testLists)
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_1)
        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsA } = cache.setAnnotations(
            reshapeUnifiedAnnotsForCaching(
                testAnnotations.slice(1, 3),
                testLists,
            ),
        )
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_1)
        expect(cache.annotations.allIds).toEqual(unifiedIdsA)
        expect(cache.annotations.byId).toEqual({
            [unifiedIdsA[0]]: {
                ...testAnnotations[1],
                unifiedId: unifiedIdsA[0],
            },
            [unifiedIdsA[1]]: {
                ...testAnnotations[2],
                unifiedId: unifiedIdsA[1],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsB } = cache.setAnnotations(
            reshapeUnifiedAnnotsForCaching(testAnnotations, testLists),
        )
        cache.setPageData(TEST_DATA.NORMALIZED_PAGE_URL_2, [])
        expectedEvents.push({
            event: 'newAnnotationsState',
            args: cache.annotations,
        })
        expectedEvents.push({
            event: 'updatedPageData',
            args: TEST_DATA.NORMALIZED_PAGE_URL_2,
        })

        expect(cache.normalizedPageUrl).toEqual(TEST_DATA.NORMALIZED_PAGE_URL_2)
        expect(cache.annotations.allIds).toEqual(unifiedIdsB)
        expect(cache.annotations.byId).toEqual({
            [unifiedIdsB[0]]: {
                ...testAnnotations[0],
                unifiedId: unifiedIdsB[0],
            },
            [unifiedIdsB[1]]: {
                ...testAnnotations[1],
                unifiedId: unifiedIdsB[1],
            },
            [unifiedIdsB[2]]: {
                ...testAnnotations[2],
                unifiedId: unifiedIdsB[2],
            },
            [unifiedIdsB[3]]: {
                ...testAnnotations[3],
                unifiedId: unifiedIdsB[3],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should not properly resolve local list IDs to cache IDs (for annotations) if lists not yet cached', () => {
        const { cache } = setupTest({
            normalizedPageUrl: TEST_DATA.NORMALIZED_PAGE_URL_1,
        })
        const testAnnotations = TEST_DATA.ANNOTATIONS()
        const testLists = TEST_DATA.LISTS()

        expect(cache.annotations.allIds).toEqual([])
        expect(cache.annotations.byId).toEqual({})
        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})

        const { unifiedIds: unifiedIdsA } = cache.setAnnotations(
            reshapeUnifiedAnnotsForCaching(
                testAnnotations,
                testLists, // Passing in lists here so input annots come with list IDs, but they won't be resolved to anything, as the cache lacks list data
            ),
        )

        expect(cache.annotations.allIds).toEqual(unifiedIdsA)
        expect(cache.annotations.byId).toEqual({
            [unifiedIdsA[0]]: {
                ...testAnnotations[0],
                unifiedId: unifiedIdsA[0],
                unifiedListIds: [],
            },
            [unifiedIdsA[1]]: {
                ...testAnnotations[1],
                unifiedId: unifiedIdsA[1],
                unifiedListIds: [],
            },
            [unifiedIdsA[2]]: {
                ...testAnnotations[2],
                unifiedId: unifiedIdsA[2],
                unifiedListIds: [],
            },
            [unifiedIdsA[3]]: {
                ...testAnnotations[3],
                unifiedId: unifiedIdsA[3],
                unifiedListIds: [],
            },
        })
        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
    })

    it('should be able to add, remove, and update lists to/from/in the cache', () => {
        const { cache, emittedEvents } = setupTest()
        const expectedEvents: EmittedEvent[] = []
        const testLists = TEST_DATA.LISTS()

        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idA } = cache.addList(testLists[0])
        expectedEvents.push({
            event: 'addedList',
            args: { ...testLists[0], unifiedId: idA },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...testLists[0], unifiedId: idA },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idB } = cache.addList(testLists[1])
        expectedEvents.push({
            event: 'addedList',
            args: { ...testLists[1], unifiedId: idB },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idB, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...testLists[0], unifiedId: idA },
            [idB]: { ...testLists[1], unifiedId: idB },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedId: idC } = cache.addList(testLists[2])
        expectedEvents.push({
            event: 'addedList',
            args: { ...testLists[2], unifiedId: idC },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idB, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...testLists[0], unifiedId: idA },
            [idB]: { ...testLists[1], unifiedId: idB },
            [idC]: { ...testLists[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        cache.removeList({ unifiedId: idB })
        expectedEvents.push({
            event: 'removedList',
            args: { ...testLists[1], unifiedId: idB },
        })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: { ...testLists[0], unifiedId: idA },
            [idC]: { ...testLists[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedListA: UnifiedList = {
            ...testLists[0],
            name: 'new list name',
        }
        cache.updateList(updatedListA)
        expectedEvents.push({ event: 'updatedList', args: updatedListA })
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual([idC, idA])
        expect(cache.lists.byId).toEqual({
            [idA]: updatedListA,
            [idC]: { ...testLists[2], unifiedId: idC },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const updatedListC: UnifiedList = {
            ...testLists[2],
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
        const testLists = TEST_DATA.LISTS()

        expect(cache.lists.allIds).toEqual([])
        expect(cache.lists.byId).toEqual({})
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsA } = cache.setLists(
            testLists.slice(0, 1),
        )
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual(unifiedIdsA)
        expect(cache.lists.byId).toEqual({
            [unifiedIdsA[0]]: {
                ...testLists[0],
                unifiedId: unifiedIdsA[0],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)

        const { unifiedIds: unifiedIdsB } = cache.setLists(testLists.slice(1))
        expectedEvents.push({ event: 'newListsState', args: cache.lists })

        expect(cache.lists.allIds).toEqual(unifiedIdsB)
        expect(cache.lists.byId).toEqual({
            [unifiedIdsB[0]]: {
                ...testLists[1],
                unifiedId: unifiedIdsB[0],
            },
            [unifiedIdsB[1]]: {
                ...testLists[2],
                unifiedId: unifiedIdsB[1],
            },
        })
        expect(emittedEvents).toEqual(expectedEvents)
    })

    it('should be able to find annotations and lists in the cache via both their local and remote IDs', () => {
        const { cache } = setupTest()
        const testLists = TEST_DATA.LISTS()
        const testAnnotations = TEST_DATA.ANNOTATIONS()

        const { unifiedIds: unifiedListIds } = cache.setLists(testLists)
        const { unifiedIds: unifiedAnnotationIds } = cache.setAnnotations(
            reshapeUnifiedAnnotsForCaching(testAnnotations, testLists),
        )

        expect(
            cache.getAnnotationByLocalId(testAnnotations[0].localId),
        ).toEqual({
            ...testAnnotations[0],
            unifiedId: unifiedAnnotationIds[0],
        })
        expect(
            cache.getAnnotationByLocalId(testAnnotations[1].localId),
        ).toEqual({
            ...testAnnotations[1],
            unifiedId: unifiedAnnotationIds[1],
        })
        expect(
            cache.getAnnotationByRemoteId(testAnnotations[1].remoteId),
        ).toEqual({
            ...testAnnotations[1],
            unifiedId: unifiedAnnotationIds[1],
        })
        expect(
            cache.getAnnotationByRemoteId(testAnnotations[3].remoteId),
        ).toEqual({
            ...testAnnotations[3],
            unifiedId: unifiedAnnotationIds[3],
        })

        expect(cache.getListByLocalId(testLists[0].localId)).toEqual({
            ...testLists[0],
            unifiedId: unifiedListIds[0],
        })
        expect(cache.getListByLocalId(testLists[1].localId)).toEqual({
            ...testLists[1],
            unifiedId: unifiedListIds[1],
        })
        expect(cache.getListByRemoteId(testLists[1].remoteId)).toEqual({
            ...testLists[1],
            unifiedId: unifiedListIds[1],
        })
        expect(cache.getListByRemoteId(testLists[2].remoteId)).toEqual({
            ...testLists[2],
            unifiedId: unifiedListIds[2],
        })

        expect(
            cache.getAnnotationByLocalId(testAnnotations[1].remoteId),
        ).toEqual(null)
        expect(
            cache.getAnnotationByRemoteId(testAnnotations[1].localId),
        ).toEqual(null)
        expect(cache.getAnnotationByLocalId('I dont exist')).toEqual(null)
        expect(cache.getAnnotationByRemoteId('I dont exist')).toEqual(null)
        expect(cache.getListByLocalId(1231231233123)).toEqual(null)
        expect(cache.getListByRemoteId('I dont exist')).toEqual(null)
    })
})
