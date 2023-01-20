import type TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'
import type {
    UnifiedList,
    UnifiedAnnotation,
    PageAnnotationsCacheEvents,
    PageAnnotationsCacheInterface,
    UnifiedAnnotationForCache,
    UnifiedListForCache,
} from './types'
import {
    AnnotationsSorter,
    sortByPagePosition,
} from 'src/sidebar/annotations-sidebar/sorting'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

export interface PageAnnotationCacheDeps {
    normalizedPageUrl: string
    sortingFn?: AnnotationsSorter
    events?: TypedEventEmitter<PageAnnotationsCacheEvents>
    debug?: boolean
}

export class PageAnnotationsCache implements PageAnnotationsCacheInterface {
    pageRemoteListIds: PageAnnotationsCacheInterface['pageRemoteListIds'] = []
    annotations: PageAnnotationsCacheInterface['annotations'] = initNormalizedState()
    lists: PageAnnotationsCacheInterface['lists'] = initNormalizedState()

    private annotationIdCounter = 0
    private listIdCounter = 0

    /*
     * Reverse indices to make local/remote list/annot -> cached ID lookups easy
     */
    private localListIdsToCacheIds = new Map<number, UnifiedList['unifiedId']>()
    private remoteListIdsToCacheIds = new Map<
        string,
        UnifiedList['unifiedId']
    >()
    private localAnnotIdsToCacheIds = new Map<
        string,
        UnifiedAnnotation['unifiedId']
    >()
    private remoteAnnotIdsToCacheIds = new Map<
        string,
        UnifiedAnnotation['unifiedId']
    >()

    constructor(private deps: PageAnnotationCacheDeps) {
        deps.sortingFn = deps.sortingFn ?? sortByPagePosition
        deps.events = deps.events ?? new EventEmitter()
    }

    private generateAnnotationId = (): string =>
        (this.annotationIdCounter++).toString()
    private generateListId = (): string => (this.listIdCounter++).toString()

    getLastAssignedAnnotationId = (): string =>
        (this.annotationIdCounter - 1).toString()
    getLastAssignedListId = (): string => (this.listIdCounter - 1).toString()
    get isEmpty(): PageAnnotationsCacheInterface['isEmpty'] {
        return this.annotations.allIds.length === 0
    }

    get normalizedPageUrl(): PageAnnotationsCacheInterface['normalizedPageUrl'] {
        return this.deps.normalizedPageUrl
    }

    get events(): PageAnnotationsCacheInterface['events'] {
        return this.deps.events
    }

    private warn = (msg: string) =>
        this.deps.debug ? console.warn(msg) : undefined

    getAnnotationsArray: PageAnnotationsCacheInterface['getAnnotationsArray'] = () =>
        normalizedStateToArray(this.annotations)

    getAnnotationByLocalId: PageAnnotationsCacheInterface['getAnnotationByLocalId'] = (
        localId,
    ) => {
        const unifiedAnnotId = this.localAnnotIdsToCacheIds.get(localId)
        if (unifiedAnnotId == null) {
            return null
        }
        return this.annotations.byId[unifiedAnnotId] ?? null
    }

    getAnnotationByRemoteId: PageAnnotationsCacheInterface['getAnnotationByRemoteId'] = (
        remoteId,
    ) => {
        const unifiedAnnotId = this.remoteAnnotIdsToCacheIds.get(remoteId)
        if (unifiedAnnotId == null) {
            return null
        }
        return this.annotations.byId[unifiedAnnotId] ?? null
    }

    getListByLocalId: PageAnnotationsCacheInterface['getListByLocalId'] = (
        localId,
    ) => {
        const unifiedListId = this.localListIdsToCacheIds.get(localId)
        if (unifiedListId == null) {
            return null
        }
        return this.lists.byId[unifiedListId] ?? null
    }

    getListByRemoteId: PageAnnotationsCacheInterface['getListByRemoteId'] = (
        remoteId,
    ) => {
        const unifiedListId = this.remoteListIdsToCacheIds.get(remoteId)
        if (unifiedListId == null) {
            return null
        }
        return this.lists.byId[unifiedListId] ?? null
    }

    private prepareListForCaching = (
        list: UnifiedListForCache,
    ): UnifiedList => {
        const unifiedId = this.generateListId()
        if (list.localId != null) {
            this.localListIdsToCacheIds.set(list.localId, unifiedId)
        }
        if (list.remoteId != null) {
            this.remoteListIdsToCacheIds.set(list.remoteId, unifiedId)
        }
        return { ...list, unifiedId }
    }

    private prepareAnnotationForCaching = (
        { localListIds, ...annotation }: UnifiedAnnotationForCache,
        opts: { now: number },
    ): UnifiedAnnotation => {
        const unifiedAnnotationId = this.generateAnnotationId()
        if (annotation.remoteId != null) {
            this.remoteAnnotIdsToCacheIds.set(
                annotation.remoteId,
                unifiedAnnotationId,
            )
        }
        if (annotation.localId != null) {
            this.localAnnotIdsToCacheIds.set(
                annotation.localId,
                unifiedAnnotationId,
            )
        }

        let privacyLevel = annotation.privacyLevel

        const unifiedListIds = [
            ...new Set(
                [
                    ...(annotation.unifiedListIds ?? []),
                    ...localListIds.map((localListId) => {
                        const unifiedListId = this.localListIdsToCacheIds.get(
                            localListId,
                        )
                        if (!unifiedListId) {
                            this.warn(
                                'No cached list data found for given local list IDs on annotation - did you remember to cache lists before annotations?',
                            )
                            return null
                        }

                        if (this.lists.byId[unifiedListId]?.remoteId != null) {
                            privacyLevel = AnnotationPrivacyLevels.PROTECTED
                        }

                        return unifiedListId
                    }),
                ].filter((id) => id != null && this.lists.byId[id] != null),
            ),
        ]

        // Ensure each list gets a ref back to this annot
        unifiedListIds.forEach((unifiedListId) => {
            this.lists.byId[unifiedListId]?.unifiedAnnotationIds.unshift(
                unifiedAnnotationId,
            )
        })

        return {
            ...annotation,
            privacyLevel,
            unifiedListIds,
            createdWhen: annotation.createdWhen ?? opts.now,
            lastEdited:
                annotation.lastEdited ?? annotation.createdWhen ?? opts.now,
            unifiedId: unifiedAnnotationId,
        }
    }

    setPageData: PageAnnotationsCacheInterface['setPageData'] = (
        normalizedPageUrl,
        remoteListIds,
    ) => {
        if (this.deps.normalizedPageUrl !== normalizedPageUrl) {
            this.deps.normalizedPageUrl = normalizedPageUrl
        }
        this.pageRemoteListIds = [...remoteListIds]
        this.events.emit(
            'updatedPageData',
            normalizedPageUrl,
            this.pageRemoteListIds,
        )
    }

    setAnnotations: PageAnnotationsCacheInterface['setAnnotations'] = (
        annotations,
        { now = Date.now() } = { now: Date.now() },
    ) => {
        this.annotationIdCounter = 0
        this.localAnnotIdsToCacheIds.clear()
        this.remoteAnnotIdsToCacheIds.clear()

        const seedData = [...annotations]
            .sort(this.deps.sortingFn)
            .map((annot) => this.prepareAnnotationForCaching(annot, { now }))
        this.annotations = initNormalizedState({
            seedData,
            getId: (annot) => annot.unifiedId,
        })
        this.events.emit('newAnnotationsState', this.annotations)

        return { unifiedIds: seedData.map((annot) => annot.unifiedId) }
    }

    setLists: PageAnnotationsCacheInterface['setLists'] = (lists) => {
        this.listIdCounter = 0
        this.localListIdsToCacheIds.clear()
        this.remoteListIdsToCacheIds.clear()

        const seedData = [...lists].map(this.prepareListForCaching)
        this.lists = initNormalizedState({
            seedData,
            getId: (list) => list.unifiedId,
        })
        this.events.emit('newListsState', this.lists)

        return { unifiedIds: seedData.map((list) => list.unifiedId) }
    }

    sortLists: PageAnnotationsCacheInterface['sortLists'] = (sortingFn) => {
        throw new Error('List sorting not yet implemented')
    }

    sortAnnotations: PageAnnotationsCacheInterface['sortAnnotations'] = (
        sortingFn,
    ) => {
        if (sortingFn) {
            this.deps.sortingFn = sortingFn
        }

        this.annotations.allIds = normalizedStateToArray(this.annotations)
            .sort(this.deps.sortingFn)
            .map((annot) => annot.unifiedId)
        this.events.emit('newAnnotationsState', this.annotations)
    }

    addAnnotation: PageAnnotationsCacheInterface['addAnnotation'] = (
        annotation,
        { now = Date.now() } = { now: Date.now() },
    ) => {
        // This covers the case of adding a downloaded remote annot that already exists locally, and thus would have been cached already
        //  (currently don't distinguish own remote annots from others')
        if (annotation.remoteId != null) {
            const existingId = this.remoteAnnotIdsToCacheIds.get(
                annotation.remoteId,
            )
            if (existingId != null) {
                return { unifiedId: existingId }
            }
        }

        const nextAnnotation = this.prepareAnnotationForCaching(annotation, {
            now,
        })

        if (nextAnnotation.privacyLevel >= AnnotationPrivacyLevels.SHARED) {
            nextAnnotation.unifiedListIds = [...this.pageRemoteListIds]
        }

        this.annotations.allIds = [
            nextAnnotation.unifiedId,
            ...this.annotations.allIds,
        ]
        this.annotations.byId = {
            ...this.annotations.byId,
            [nextAnnotation.unifiedId]: nextAnnotation,
        }

        this.events.emit('addedAnnotation', nextAnnotation)
        this.events.emit('newAnnotationsState', this.annotations)
        return { unifiedId: nextAnnotation.unifiedId }
    }

    addList: PageAnnotationsCacheInterface['addList'] = (list) => {
        const nextList = this.prepareListForCaching(list)
        this.lists.allIds = [nextList.unifiedId, ...this.lists.allIds]
        this.lists.byId = {
            ...this.lists.byId,
            [nextList.unifiedId]: nextList,
        }

        this.events.emit('addedList', nextList)
        this.events.emit('newListsState', this.lists)
        return { unifiedId: nextList.unifiedId }
    }

    updateAnnotation: PageAnnotationsCacheInterface['updateAnnotation'] = (
        updates,
        opts,
    ) => {
        const previous = this.annotations.byId[updates.unifiedId]
        if (!previous) {
            throw new Error('No existing cached annotation found to update')
        }

        let unifiedListIds = [...previous.unifiedListIds]
        let privacyLevel = updates.privacyLevel

        if (previous.privacyLevel === updates.privacyLevel) {
            unifiedListIds = [...updates.unifiedListIds]
        } else if (
            previous.privacyLevel !== AnnotationPrivacyLevels.PRIVATE &&
            updates.privacyLevel <= AnnotationPrivacyLevels.PRIVATE
        ) {
            if (opts?.keepListsIfUnsharing) {
                // Keep all lists, but need to change level to 'protected'
                privacyLevel = AnnotationPrivacyLevels.PROTECTED
            } else {
                // Keep only private lists
                unifiedListIds = unifiedListIds.filter(
                    (listId) => !this.lists.byId[listId]?.remoteId,
                )
            }
        } else if (
            previous.privacyLevel <= AnnotationPrivacyLevels.PRIVATE &&
            updates.privacyLevel >= AnnotationPrivacyLevels.SHARED
        ) {
            // Need to inherit parent page's shared lists if sharing
            unifiedListIds = Array.from(
                new Set([...unifiedListIds, ...this.pageRemoteListIds]),
            )
        }

        const next: UnifiedAnnotation = {
            ...previous,
            privacyLevel,
            unifiedListIds,
            comment: updates.comment,
            remoteId: updates.remoteId ?? previous.remoteId,
            lastEdited: opts?.updateLastEditedTimestamp
                ? opts?.now ?? Date.now()
                : previous.lastEdited,
        }

        this.annotations = {
            ...this.annotations,
            byId: {
                ...this.annotations.byId,
                [updates.unifiedId]: next,
            },
        }
        this.events.emit('updatedAnnotation', next)
        this.events.emit('newAnnotationsState', this.annotations)
    }

    updateList: PageAnnotationsCacheInterface['updateList'] = (updates) => {
        const previousList = this.lists.byId[updates.unifiedId]
        if (!previousList) {
            throw new Error('No existing cached list found to update')
        }

        const nextList: UnifiedList = {
            ...previousList,
            name: updates.name,
            description: updates.description,
        }

        this.lists = {
            ...this.lists,
            byId: {
                ...this.lists.byId,
                [updates.unifiedId]: nextList,
            },
        }
        this.events.emit('updatedList', nextList)
        this.events.emit('newListsState', this.lists)
    }

    removeAnnotation: PageAnnotationsCacheInterface['removeAnnotation'] = (
        annotation,
    ) => {
        const previousAnnotation = this.annotations.byId[annotation.unifiedId]
        if (!previousAnnotation) {
            throw new Error('No existing cached annotation found to remove')
        }

        this.annotations.allIds = this.annotations.allIds.filter(
            (unifiedAnnotId) => unifiedAnnotId !== annotation.unifiedId,
        )
        delete this.annotations.byId[annotation.unifiedId]

        this.events.emit('removedAnnotation', previousAnnotation)
        this.events.emit('newAnnotationsState', this.annotations)
    }

    removeList: PageAnnotationsCacheInterface['removeList'] = (list) => {
        const previousList = this.lists.byId[list.unifiedId]
        if (!previousList) {
            throw new Error('No existing cached list found to remove')
        }

        this.lists.allIds = this.lists.allIds.filter(
            (unifiedListId) => unifiedListId !== list.unifiedId,
        )
        delete this.lists.byId[list.unifiedId]

        this.events.emit('removedList', previousList)
        this.events.emit('newListsState', this.lists)
    }
}
