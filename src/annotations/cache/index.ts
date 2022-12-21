import type TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'
import type {
    UnifiedList,
    UnifiedAnnotation,
    PageAnnotationsCacheEvents,
    PageAnnotationsCacheInterface,
    UnifiedAnnotationForCache,
} from './types'
import {
    AnnotationsSorter,
    sortByPagePosition,
} from 'src/sidebar/annotations-sidebar/sorting'
import {
    initNormalizedState,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'

export interface PageAnnotationCacheDeps {
    normalizedPageUrl: string
    sortingFn?: AnnotationsSorter
    events?: TypedEventEmitter<PageAnnotationsCacheEvents>
    debug?: boolean
}

export class PageAnnotationsCache implements PageAnnotationsCacheInterface {
    annotations: PageAnnotationsCacheInterface['annotations'] = initNormalizedState()
    lists: PageAnnotationsCacheInterface['lists'] = initNormalizedState()

    private annotationIdCounter = 0
    private listIdCounter = 0

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

    get highlights(): UnifiedAnnotation[] {
        return normalizedStateToArray(this.annotations).filter(
            (a) => a.body?.length > 0,
        )
    }

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
        const matchingAnnotation = Object.values(this.annotations.byId).find(
            (annot) => annot.localId != null && annot.localId === localId,
        )
        return matchingAnnotation ?? null
    }

    getAnnotationByRemoteId: PageAnnotationsCacheInterface['getAnnotationByRemoteId'] = (
        remoteId,
    ) => {
        const matchingAnnotation = Object.values(this.annotations.byId).find(
            (annot) => annot.remoteId != null && annot.remoteId === remoteId,
        )
        return matchingAnnotation ?? null
    }

    getListByLocalId: PageAnnotationsCacheInterface['getListByLocalId'] = (
        localId,
    ) => {
        const matchingList = Object.values(this.lists.byId).find(
            (list) => list.localId != null && list.localId === localId,
        )
        return matchingList ?? null
    }

    getListByRemoteId: PageAnnotationsCacheInterface['getListByRemoteId'] = (
        remoteId,
    ) => {
        const matchingList = Object.values(this.lists.byId).find(
            (list) => list.remoteId != null && list.remoteId === remoteId,
        )
        return matchingList ?? null
    }

    private prepareAnnotationForCaching = (
        { localListIds, ...annotation }: UnifiedAnnotationForCache,
        opts: { now: number },
    ): UnifiedAnnotation => {
        const unifiedListIds = localListIds
            .map((localListId) => {
                const unifiedList = this.getListByLocalId(localListId)
                if (!unifiedList) {
                    this.warn(
                        'No cached list data found for given local list IDs on annotation',
                    )
                    return null
                }
                return unifiedList.unifiedId
            })
            .filter((id) => id != null)
        return {
            ...annotation,
            unifiedListIds,
            createdWhen: annotation.createdWhen ?? opts.now,
            lastEdited:
                annotation.lastEdited ?? annotation.createdWhen ?? opts.now,
            unifiedId: this.generateAnnotationId(),
        }
    }

    setAnnotations: PageAnnotationsCacheInterface['setAnnotations'] = (
        normalizedPageUrl,
        annotations,
        { now = Date.now() } = { now: Date.now() },
    ) => {
        this.annotationIdCounter = 0
        if (this.deps.normalizedPageUrl !== normalizedPageUrl) {
            this.deps.normalizedPageUrl = normalizedPageUrl
            this.events.emit('updatedPageUrl', normalizedPageUrl)
        }

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

        const seedData = [...lists].map((list) => ({
            ...list,
            unifiedId: this.generateListId(),
        }))
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
        const nextAnnotation = this.prepareAnnotationForCaching(annotation, {
            now,
        })

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
        const nextList: UnifiedList = {
            ...list,
            unifiedId: this.generateListId(),
        }

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
        const previousAnnotation = this.annotations.byId[updates.unifiedId]
        if (!previousAnnotation) {
            throw new Error('No existing cached annotation found to update')
        }

        const nextAnnotation: UnifiedAnnotation = {
            ...previousAnnotation,
            comment: updates.comment,
            privacyLevel: updates.privacyLevel,
            unifiedListIds: updates.unifiedListIds,
            lastEdited: opts?.updateLastEditedTimestamp
                ? opts?.now ?? Date.now()
                : previousAnnotation.lastEdited,
        }

        this.annotations = {
            ...this.annotations,
            byId: {
                ...this.annotations.byId,
                [updates.unifiedId]: nextAnnotation,
            },
        }
        this.events.emit('updatedAnnotation', nextAnnotation)
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
