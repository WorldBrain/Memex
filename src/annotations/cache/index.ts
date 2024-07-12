import type TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'
import fromPairs from 'lodash/fromPairs'
import type {
    UnifiedList,
    UnifiedAnnotation,
    PageAnnotationsCacheEvents,
    PageAnnotationsCacheInterface,
    UnifiedAnnotationForCache,
    UnifiedListForCache,
    RGBAColor,
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
import { areArrayContentsEqual } from '@worldbrain/memex-common/lib/utils/array-comparison'
import {
    forEachTreeTraverse,
    mapTreeTraverse,
} from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import {
    defaultOrderableSorter,
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'

export interface PageAnnotationCacheDeps {
    sortingFn?: AnnotationsSorter
    events?: TypedEventEmitter<PageAnnotationsCacheEvents>
    debug?: boolean
}

export class PageAnnotationsCache implements PageAnnotationsCacheInterface {
    normalizedPageUrlsToPageLinkListIds: PageAnnotationsCacheInterface['normalizedPageUrlsToPageLinkListIds'] = new Map()
    pageListIds: PageAnnotationsCacheInterface['pageListIds'] = new Map()
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

    private highlightColorDict: HighlightColor[]

    constructor(private deps: PageAnnotationCacheDeps) {
        deps.sortingFn = deps.sortingFn ?? sortByPagePosition
        deps.events = deps.events ?? new EventEmitter()
    }

    private generateAnnotationId = (): string =>
        (this.annotationIdCounter++).toString()
    private generateListId = (): string => (this.listIdCounter++).toString()
    private isListShared = (listId: UnifiedList['unifiedId']): boolean =>
        this.lists.byId[listId]?.remoteId != null

    getLastAssignedAnnotationId = (): string =>
        (this.annotationIdCounter - 1).toString()
    getLastAssignedListId = (): string => (this.listIdCounter - 1).toString()
    get isEmpty(): PageAnnotationsCacheInterface['isEmpty'] {
        return this.annotations.allIds.length === 0
    }

    get events(): PageAnnotationsCacheInterface['events'] {
        return this.deps.events
    }

    private warn = (msg: string) =>
        this.deps.debug ? console.warn(msg) : undefined

    setHighlightColorDictionary: PageAnnotationsCacheInterface['setHighlightColorDictionary'] = (
        colors,
    ) => {
        this.highlightColorDict = colors
    }

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

    getListsByParentId: PageAnnotationsCacheInterface['getListsByParentId'] = (
        unifiedId,
    ) => {
        return [
            ...normalizedStateToArray(this.lists).filter(
                (list) =>
                    list.parentUnifiedId === unifiedId &&
                    list.type === 'user-list',
            ),
        ].sort(defaultOrderableSorter)
    }

    getAllListsInTreeByRootId: PageAnnotationsCacheInterface['getAllListsInTreeByRootId'] = (
        rootUnifiedId,
    ) => {
        return [
            ...normalizedStateToArray(this.lists).filter((list) =>
                list.pathUnifiedIds.length === 0
                    ? list.unifiedId === rootUnifiedId
                    : list.pathUnifiedIds[0] === rootUnifiedId,
            ),
        ]
    }

    private prepareListForCaching = (
        list: UnifiedListForCache,
        opts?: { skipAssociatingAnnotations?: boolean },
    ): UnifiedList => {
        const unifiedId = this.generateListId()
        if (list.remoteId != null) {
            this.remoteListIdsToCacheIds.set(list.remoteId, unifiedId)
        }
        if (list.localId != null) {
            this.localListIdsToCacheIds.set(list.localId, unifiedId)
        }
        if (list.remoteId != null && !opts?.skipAssociatingAnnotations) {
            // Ensure each public annot gets a ref to this list
            for (const annotation of normalizedStateToArray(this.annotations)) {
                if (
                    annotation.privacyLevel < AnnotationPrivacyLevels.SHARED ||
                    annotation.creator?.id !== list.creator?.id
                ) {
                    continue
                }
                list.unifiedAnnotationIds.push(annotation.unifiedId)
            }
        }

        // Ensure each annot gets a ref back to this list
        list.unifiedAnnotationIds.forEach((unifiedAnnotId) => {
            const cachedAnnot = this.annotations.byId[unifiedAnnotId]
            if (
                !cachedAnnot ||
                cachedAnnot.unifiedListIds.includes(unifiedId)
            ) {
                return
            }
            cachedAnnot.unifiedListIds.unshift(unifiedId)
        })

        return {
            ...list,
            pathLocalIds: list.pathLocalIds ?? [],
            unifiedId,
        } as UnifiedList
    }

    private prepareAnnotationForCaching = (
        { localListIds, ...annotation }: UnifiedAnnotationForCache,
        opts: { now: number },
    ): UnifiedAnnotation => {
        const unifiedAnnotationId = this.generateAnnotationId()

        if (annotation.color == null) {
            annotation.color =
                this.highlightColorDict?.[0]?.id ??
                HIGHLIGHT_COLORS_DEFAULT[0].id
        }

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
            const cachedList = this.lists.byId[unifiedListId]
            if (
                !cachedList ||
                cachedList.unifiedAnnotationIds.includes(unifiedAnnotationId)
            ) {
                return
            }
            cachedList.unifiedAnnotationIds.unshift(unifiedAnnotationId)
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

    private ensurePageListsSet(
        normalizedPageUrl: string,
        unifiedListIds: UnifiedList['unifiedId'][],
    ): void {
        const listIds = this.pageListIds.get(normalizedPageUrl) ?? new Set()
        for (const listId of unifiedListIds) {
            if (!this.lists.byId[listId] || listIds.has(listId)) {
                continue
            }
            listIds.add(listId)
        }
        this.pageListIds.set(normalizedPageUrl, listIds)
    }

    private trackPageLinkListForPage(list: UnifiedList<'page-link'>) {
        const pageLinkListIds =
            this.normalizedPageUrlsToPageLinkListIds.get(
                list.normalizedPageUrl,
            ) ?? new Set()
        pageLinkListIds.add(list.unifiedId)
        this.normalizedPageUrlsToPageLinkListIds.set(
            list.normalizedPageUrl,
            pageLinkListIds,
        )
    }

    setPageData: PageAnnotationsCacheInterface['setPageData'] = (
        normalizedPageUrl,
        nextPageLists,
    ) => {
        const previousPageLists = [
            ...(this.pageListIds.get(normalizedPageUrl) ?? []),
        ]
        if (this.pageListIds.has(normalizedPageUrl)) {
            this.pageListIds.get(normalizedPageUrl).clear()
        }

        this.ensurePageListsSet(normalizedPageUrl, nextPageLists)
        this.events.emit(
            'updatedPageData',
            normalizedPageUrl,
            this.pageListIds.get(normalizedPageUrl) ?? new Set(),
        )
        const changedAnnots = this.updateSharedAnnotationsWithSharedPageLists()

        // TODO: The fact we have to do this nested loop makes me think there's a better way to structure this data

        // Ensure any changed annots also have/don't have reverse references from the page lists
        for (const listId of [...previousPageLists, ...nextPageLists]) {
            const listData = this.lists.byId[listId]
            if (!listData) {
                continue
            }

            for (const annotId of changedAnnots) {
                const annotData = this.annotations.byId[annotId]
                if (!annotData) {
                    continue
                }

                if (annotData.unifiedListIds.includes(listId)) {
                    // List ref'd from annot - ensure ref to that annot from list exists
                    listData.unifiedAnnotationIds = Array.from(
                        new Set([...listData.unifiedAnnotationIds, annotId]),
                    )
                } else {
                    // List not ref'd from annot - ensure ref to that annot from list is removed
                    listData.unifiedAnnotationIds = listData.unifiedAnnotationIds.filter(
                        (_annotId) => _annotId !== annotId,
                    )
                }
            }
        }

        if (changedAnnots.length > 0) {
            this.events.emit('newListsState', this.lists)
        }
    }

    getSharedPageListIds(
        normalizedPageUrl: string,
    ): UnifiedList['unifiedId'][] {
        return [...(this.pageListIds.get(normalizedPageUrl) ?? [])].filter(
            this.isListShared,
        )
    }

    private updateSharedAnnotationsWithSharedPageLists(): string[] {
        const changedAnnots: string[] = []
        let shouldEmitAnnotUpdateEvent = false
        this.annotations = initNormalizedState({
            getId: (annot) => annot.unifiedId,
            seedData: normalizedStateToArray(this.annotations).map((annot) => {
                const nextUnifiedListIds = Array.from(
                    new Set([
                        ...this.getSharedPageListIds(annot.normalizedPageUrl),
                        ...annot.unifiedListIds.filter(
                            (listId) => !this.isListShared(listId),
                        ),
                    ]),
                )
                if (
                    annot.privacyLevel < AnnotationPrivacyLevels.SHARED ||
                    areArrayContentsEqual(
                        annot.unifiedListIds,
                        nextUnifiedListIds,
                    )
                ) {
                    return annot
                }
                changedAnnots.push(annot.unifiedId)

                shouldEmitAnnotUpdateEvent = true
                return { ...annot, unifiedListIds: nextUnifiedListIds }
            }),
        })

        if (shouldEmitAnnotUpdateEvent) {
            this.events.emit('newAnnotationsState', this.annotations)
        }

        return changedAnnots
    }

    private updateCachedListAnnotationRefsForAnnotationUpdate(
        prev: Pick<UnifiedAnnotation, 'unifiedListIds' | 'unifiedId'>,
        next: Pick<UnifiedAnnotation, 'unifiedListIds'>,
    ): void {
        // For each removed list, ensure annotation link is removed from cached list
        const removedListIds = prev.unifiedListIds.filter(
            (listId) => !next.unifiedListIds.includes(listId),
        )
        for (const listId of removedListIds) {
            const cachedList = this.lists.byId[listId]
            if (cachedList) {
                cachedList.unifiedAnnotationIds = cachedList.unifiedAnnotationIds.filter(
                    (annotId) => annotId !== prev.unifiedId,
                )
            }
        }

        // For each added list, ensure annotation link is added to cached list
        const addedListIds = next.unifiedListIds.filter(
            (listId) => !prev.unifiedListIds.includes(listId),
        )
        for (const listId of addedListIds) {
            const cachedList = this.lists.byId[listId]
            if (
                cachedList &&
                !cachedList.unifiedAnnotationIds.includes(prev.unifiedId)
            ) {
                cachedList.unifiedAnnotationIds.push(prev.unifiedId)
            }
        }
    }

    setAnnotations: PageAnnotationsCacheInterface['setAnnotations'] = (
        annotations,
        { now = Date.now(), keepExistingData } = { now: Date.now() },
    ) => {
        if (!keepExistingData) {
            this.annotationIdCounter = 0
            this.localAnnotIdsToCacheIds.clear()
            this.remoteAnnotIdsToCacheIds.clear()
        }

        const seedData = [...annotations]
            .sort(this.deps.sortingFn)
            .filter((annot) => {
                if (!keepExistingData) {
                    return true
                }
                // If we're keeping existing data, only add annotations that don't already exist in the cache
                if (annot.localId != null) {
                    return this.getAnnotationByLocalId(annot.localId) == null
                } else if (annot.remoteId != null) {
                    return this.getAnnotationByRemoteId(annot.remoteId) == null
                }
                return true
            })
            .map((annot) => this.prepareAnnotationForCaching(annot, { now }))

        if (keepExistingData) {
            seedData.push(...normalizedStateToArray(this.annotations))
        }

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

        const localToCacheId = new Map<number, string>()
        const seedData = [...lists].map((list) => {
            const prepared = this.prepareListForCaching(list, {
                skipAssociatingAnnotations: true,
            })
            if (list.localId) {
                localToCacheId.set(list.localId, prepared.unifiedId)
            }
            return prepared
        })

        // Go over prepared lists once more to fix parent cache IDs
        for (const list of seedData) {
            list.pathUnifiedIds = list.pathLocalIds
                .map((localId) => localToCacheId.get(localId))
                .filter((id) => id != null)

            if (list.type === 'page-link') {
                this.trackPageLinkListForPage(list)
            }

            if (list.type !== 'user-list') {
                continue
            }
            if (list.parentLocalId != null) {
                list.parentUnifiedId =
                    localToCacheId.get(list.parentLocalId) ?? null
            }
        }

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
            nextAnnotation.unifiedListIds = [
                ...new Set([
                    ...this.getSharedPageListIds(
                        nextAnnotation.normalizedPageUrl,
                    ),
                    ...nextAnnotation.unifiedListIds,
                ]),
            ]
        }

        this.annotations.allIds = [
            nextAnnotation.unifiedId,
            ...this.annotations.allIds,
        ]
        this.annotations.byId = {
            ...this.annotations.byId,
            [nextAnnotation.unifiedId]: nextAnnotation,
        }

        this.updateCachedListAnnotationRefsForAnnotationUpdate(
            {
                unifiedId: nextAnnotation.unifiedId,
                unifiedListIds: [],
            },
            nextAnnotation,
        )

        this.events.emit('addedAnnotation', nextAnnotation)
        this.events.emit('newAnnotationsState', this.annotations)
        return { unifiedId: nextAnnotation.unifiedId }
    }

    addList: PageAnnotationsCacheInterface['addList'] = (list, opts) => {
        const nextList = this.prepareListForCaching(list)
        nextList.pathUnifiedIds = nextList.pathLocalIds
            .map((id) => this.getListByLocalId(id)?.unifiedId)
            .filter((id) => id != null)

        if (nextList.type === 'user-list') {
            if (nextList.parentLocalId != null) {
                nextList.parentUnifiedId =
                    this.getListByLocalId(nextList.parentLocalId)?.unifiedId ??
                    null
            } else {
                nextList.parentUnifiedId = null
            }

            if (nextList.order == null) {
                const siblings = this.getListsByParentId(
                    nextList.parentUnifiedId ?? null,
                )
                const items = siblings.map((list) => ({
                    id: list.unifiedId,
                    key: list.order,
                }))
                nextList.order =
                    items.length > 0
                        ? insertOrderedItemBeforeIndex(
                              items,
                              nextList.unifiedId,
                              0,
                          ).create.key
                        : pushOrderedItem(items, nextList.unifiedId).create.key
            }
        }

        this.lists.allIds = [nextList.unifiedId, ...this.lists.allIds]
        this.lists.byId = {
            ...this.lists.byId,
            [nextList.unifiedId]: nextList,
        }

        if (nextList.type === 'page-link') {
            this.trackPageLinkListForPage(nextList)
            this.ensurePageListsSet(nextList.normalizedPageUrl, [
                nextList.unifiedId,
            ])
        }

        if (!opts?.skipEventEmission) {
            this.events.emit('addedList', nextList)
        }
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

        let nextUnifiedListIds = [...previous.unifiedListIds]

        if (
            opts?.forceListUpdate ||
            previous.privacyLevel === updates.privacyLevel
        ) {
            nextUnifiedListIds = [...updates.unifiedListIds]
        } else if (
            previous.privacyLevel !== AnnotationPrivacyLevels.PRIVATE &&
            updates.privacyLevel <= AnnotationPrivacyLevels.PRIVATE
        ) {
            if (opts?.keepListsIfUnsharing) {
                // Keep all lists, but need to change level to 'protected'
                updates.privacyLevel = AnnotationPrivacyLevels.PROTECTED
            } else {
                // Keep only private lists
                nextUnifiedListIds = nextUnifiedListIds.filter(
                    (listId) => !this.isListShared(listId),
                )
            }
        } else if (
            previous.privacyLevel <= AnnotationPrivacyLevels.PRIVATE &&
            updates.privacyLevel >= AnnotationPrivacyLevels.SHARED
        ) {
            // This is selectively-shared -> auto-added case. Needs to replace all lists with the parent page's
            nextUnifiedListIds = this.getSharedPageListIds(
                previous.normalizedPageUrl,
            )
        }

        if (previous.remoteId !== updates.remoteId) {
            this.remoteAnnotIdsToCacheIds.set(
                updates.remoteId,
                previous.unifiedId,
            )
        }

        // if (updates.color != null) {
        //     const annotColorObject = this.highlightColorSettings.find(
        //         (item) => item.id === updates.color,
        //     )?.color

        //     updates.color = annotColorObject
        // }

        const next: UnifiedAnnotation = {
            ...previous,
            privacyLevel: updates.privacyLevel,
            unifiedListIds: nextUnifiedListIds,
            comment: updates.comment ?? previous.comment,
            body: updates.body ?? previous.body,
            remoteId: updates.remoteId ?? previous.remoteId,
            lastEdited: opts?.updateLastEditedTimestamp
                ? opts?.now ?? Date.now()
                : previous.lastEdited,
            color: updates.color ?? previous.color,
        }

        this.updateCachedListAnnotationRefsForAnnotationUpdate(previous, next)

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
            name: updates.name ?? previousList.name,
            order: updates.order ?? previousList.order,
            remoteId: updates.remoteId ?? previousList.remoteId,
            collabKey: updates.collabKey ?? previousList.collabKey,
            isPrivate: updates.isPrivate ?? previousList.isPrivate,
            description: updates.description ?? previousList.description,
            parentUnifiedId:
                // If it's `null`, then we're updating a list tree node to be a top-level node
                updates.parentUnifiedId === null
                    ? updates.parentUnifiedId
                    : updates.parentUnifiedId ?? previousList.parentUnifiedId,
        }

        if (
            previousList.type === 'page-link' &&
            nextList.type === 'page-link'
        ) {
            nextList.normalizedPageUrl =
                updates.normalizedPageUrl ?? previousList.normalizedPageUrl
            nextList.sharedListEntryId =
                updates.sharedListEntryId ?? previousList.sharedListEntryId
            nextList.hasRemoteAnnotationsToLoad =
                updates.hasRemoteAnnotationsToLoad ??
                previousList.hasRemoteAnnotationsToLoad
        }

        // If list was shared, set up reverse ref from remote->cached ID
        if (previousList.remoteId !== nextList.remoteId) {
            this.remoteListIdsToCacheIds.set(
                nextList.remoteId,
                nextList.unifiedId,
            )
        }

        this.lists = {
            ...this.lists,
            byId: {
                ...this.lists.byId,
                [updates.unifiedId]: nextList,
            },
        }

        // If the parent has changed, this plus all descendent lists must update ancestor references
        if (previousList.parentUnifiedId !== nextList.parentUnifiedId) {
            forEachTreeTraverse({
                root: nextList,
                getChildren: (node) => this.getListsByParentId(node.unifiedId),
                cb: (node) => {
                    const nodeParent = this.lists.byId[node.parentUnifiedId]
                    if (!nodeParent) {
                        node.parentUnifiedId = null
                        node.parentLocalId = null
                        node.pathUnifiedIds = []
                        node.pathLocalIds = []
                        return
                    }

                    node.parentUnifiedId = nodeParent.unifiedId
                    node.parentLocalId = nodeParent.localId ?? null
                    node.pathUnifiedIds = [
                        ...(nodeParent.pathUnifiedIds ?? []),
                        nodeParent.unifiedId,
                    ]
                    node.pathLocalIds = [
                        ...(nodeParent.pathLocalIds ?? []),
                        nodeParent.localId,
                    ].filter((id) => id != null)
                },
            })
        }

        this.events.emit('updatedList', nextList)
        this.events.emit('newListsState', this.lists)

        // NOTE: This stuff should no longer be relevant as all lists are shared by default now

        // If list was shared, reflect updates in any public annotations.
        //  Note this needs to be separate to the previous condition else things go silly due to some timing issue. TODO: Figure out why and document
        if (previousList.remoteId !== nextList.remoteId) {
            const changedAnnots = this.updateSharedAnnotationsWithSharedPageLists()

            // Ensure any annots that were added to this list have a reverse reference from this list
            nextList.unifiedAnnotationIds = Array.from(
                new Set([
                    ...previousList.unifiedAnnotationIds,
                    ...changedAnnots,
                ]),
            )
        }
    }

    removeAnnotation: PageAnnotationsCacheInterface['removeAnnotation'] = ({
        unifiedId,
        localId,
    }) => {
        let unifiedIdInferred = unifiedId
        if (localId != null) {
            unifiedIdInferred = this.localAnnotIdsToCacheIds.get(localId)
        }

        const previousAnnotation = this.annotations.byId[unifiedIdInferred]
        if (!previousAnnotation) {
            throw new Error('No existing cached annotation found to remove')
        }

        if (previousAnnotation.remoteId != null) {
            this.remoteAnnotIdsToCacheIds.delete(previousAnnotation.remoteId)
        }
        if (previousAnnotation.localId != null) {
            this.localAnnotIdsToCacheIds.delete(previousAnnotation.localId)
        }
        delete this.annotations.byId[previousAnnotation.unifiedId]
        this.annotations.allIds = this.annotations.allIds.filter(
            (id) => id !== unifiedIdInferred,
        )

        this.events.emit('removedAnnotation', previousAnnotation)
        this.events.emit('newAnnotationsState', this.annotations)
    }

    removeList: PageAnnotationsCacheInterface['removeList'] = (
        { unifiedId },
        opts,
    ) => {
        const targetList = this.lists.byId[unifiedId]
        if (!targetList) {
            throw new Error('No existing cached list found to remove')
        }

        // Ensure we delete all descendent lists as well, in order from leaves to the target
        const descendentLists = mapTreeTraverse({
            strategy: 'dfs',
            root: targetList,
            cb: (node) => node,
            getChildren: (node) => this.getListsByParentId(node.unifiedId),
        }).reverse()

        for (const listToRemove of descendentLists) {
            if (listToRemove.remoteId != null) {
                this.remoteListIdsToCacheIds.delete(listToRemove.remoteId)
            }
            if (listToRemove.localId != null) {
                this.localListIdsToCacheIds.delete(listToRemove.localId)
            }
            this.lists.allIds = this.lists.allIds.filter(
                (unifiedListId) => unifiedListId !== listToRemove.unifiedId,
            )
            delete this.lists.byId[listToRemove.unifiedId]
            if (!opts?.skipEventEmission) {
                this.events.emit('removedList', listToRemove)
            }
        }

        this.events.emit('newListsState', this.lists)
    }
}
