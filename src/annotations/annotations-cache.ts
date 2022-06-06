import type TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'

import type { Annotation } from 'src/annotations/types'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { RemoteTagsInterface } from 'src/tags/background/types'
import type { AnnotationInterface } from 'src/annotations/background/types'
import {
    AnnotationsSorter,
    sortByPagePosition,
} from 'src/sidebar/annotations-sidebar/sorting'
import { haveArraysChanged } from 'src/util/have-tags-changed'
import type {
    AnnotationSharingState,
    ContentSharingInterface,
} from 'src/content-sharing/background/types'
import {
    createAnnotation,
    updateAnnotation,
    AnnotationShareOpts,
} from './annotation-save-logic'
import {
    PageList,
    RemoteCollectionsInterface,
} from 'src/custom-lists/background/types'
import { maybeGetAnnotationPrivacyState } from '@worldbrain/memex-common/lib/content-sharing/utils'

export type CachedAnnotation = Annotation & { remoteId: string | number | null }

export const createAnnotationsCache = (
    bgModules: {
        tags: RemoteTagsInterface
        customLists: RemoteCollectionsInterface
        annotations: AnnotationInterface<'caller'>
        contentSharing: ContentSharingInterface
    },
    options: { skipPageIndexing?: boolean } = {},
): AnnotationsCache =>
    new AnnotationsCache({
        getListFromId: async (id: number) =>
            bgModules.customLists.fetchListById({ id }),
        sortingFn: sortByPagePosition,
        backendOperations: {
            load: async (pageUrl) => {
                const annotations = await bgModules.annotations.listAnnotationsByPageUrl(
                    {
                        pageUrl,
                        withTags: true,
                        withLists: true,
                    },
                )

                const annotationUrls = annotations.map((a) => a.url)
                const [privacyLevels, remoteAnnotationIds] = await Promise.all([
                    bgModules.contentSharing.findAnnotationPrivacyLevels({
                        annotationUrls,
                    }),
                    bgModules.contentSharing.getRemoteAnnotationIds({
                        annotationUrls,
                    }),
                ])

                return annotations.map((annot) => {
                    const privacyState = maybeGetAnnotationPrivacyState(
                        privacyLevels[annot.url] as AnnotationPrivacyLevels,
                    )
                    return {
                        ...annot,
                        isShared: privacyState.public,
                        isBulkShareProtected: privacyState.protected,
                        remoteId: remoteAnnotationIds[annot.url] ?? null,
                    }
                })
            },
            create: async (annotation, shareOpts) => {
                const { savePromise } = await createAnnotation({
                    shareOpts,
                    annotationsBG: bgModules.annotations,
                    contentSharingBG: bgModules.contentSharing,
                    skipPageIndexing: options.skipPageIndexing,
                    annotationData: {
                        localId: annotation.url,
                        body: annotation.body,
                        comment: annotation.comment,
                        fullPageUrl: annotation.pageUrl,
                        createdWhen: annotation.createdWhen,
                        pageTitle: annotation.pageTitle,
                        selector: annotation.selector,
                    },
                })
                const localId = await savePromise
                return localId
            },
            update: async (annotation, shareOpts) => {
                const { savePromise } = await updateAnnotation({
                    shareOpts,
                    annotationsBG: bgModules.annotations,
                    contentSharingBG: bgModules.contentSharing,
                    skipPageIndexing: options.skipPageIndexing,
                    keepListsIfUnsharing: shareOpts.keepListsIfUnsharing,
                    annotationData: {
                        comment: annotation.comment,
                        localId: annotation.url,
                    },
                })
                await savePromise
            },
            delete: async (annotation) =>
                bgModules.annotations.deleteAnnotation(annotation.url),
            updateTags: async (annotationUrl, tags) =>
                bgModules.tags.setTagsForAnnotation({
                    url: annotationUrl,
                    tags,
                }),
            updateLists: async (
                annotationUrl,
                prevListIds,
                nextListIds,
                options,
            ) => {
                const listsToAdd = nextListIds.filter(
                    (list) => !prevListIds.includes(list),
                )
                const listsToDelete = prevListIds.filter(
                    (list) => !nextListIds.includes(list),
                )

                let sharingState: AnnotationSharingState = {} as AnnotationSharingState
                if (listsToAdd.length) {
                    const result = await bgModules.contentSharing.shareAnnotationToSomeLists(
                        {
                            annotationUrl,
                            localListIds: listsToAdd,
                            protectAnnotation: options?.protectAnnotation,
                        },
                    )
                    sharingState = result.sharingState
                }
                for (const localListId of listsToDelete) {
                    const result = await bgModules.contentSharing.unshareAnnotationFromList(
                        {
                            localListId,
                            annotationUrl,
                        },
                    )
                    sharingState = result.sharingState
                }
                return sharingState
            },
            loadPageData: async (pageUrl) => {
                const lists = await bgModules.customLists.fetchListIdsByUrl({
                    url: pageUrl,
                })
                const remoteListIds = await bgModules.contentSharing.getRemoteListIds(
                    { localListIds: lists },
                )
                return {
                    url: pageUrl,
                    sharedLists: lists.filter(
                        (listId) => remoteListIds[listId],
                    ),
                    privateLists: lists.filter(
                        (listId) => !remoteListIds[listId],
                    ),
                }
            },
            loadListData: async () => {
                const lists = await bgModules.customLists.fetchAllLists({})
                const remoteListIds = await bgModules.contentSharing.getRemoteListIds(
                    {
                        localListIds: lists.map((l) => l.id),
                    },
                )

                return lists.reduce(
                    (acc, l) => ({
                        ...acc,
                        [l.id]: {
                            name: l.name,
                            remoteId: remoteListIds[l.id] ?? null,
                        },
                    }),
                    {},
                )
            },
        },
    })

interface AnnotationCacheChanges {
    rollback: (annotations: CachedAnnotation[]) => void
    newState: (annotation: CachedAnnotation[]) => void
    newStateIntent: (annotation: CachedAnnotation[]) => void
    sorted: (annotations: CachedAnnotation[]) => void
    created: (annotation: CachedAnnotation) => void
    updated: (annotation: CachedAnnotation) => void
    deleted: (annotation: CachedAnnotation) => void
    load: (annotation: CachedAnnotation[]) => void
    noteAddedToRemote: (annotation: CachedAnnotation[]) => void
}

interface ModifiedList {
    added: number | null
    deleted: number | null
}

export type AnnotationCacheChangeEvents = TypedEventEmitter<
    AnnotationCacheChanges
>

export interface AnnotationsCacheDependencies {
    getListFromId: (id: number) => Promise<PageList>
    sortingFn: AnnotationsSorter
    backendOperations: {
        load: (
            pageUrl: string,
            args?: { limit?: number; skip?: number },
        ) => Promise<CachedAnnotation[]> // url should become one concrete example of a contentFingerprint to load annotations for
        create: (
            annotation: Annotation,
            shareOpts?: AnnotationShareOpts,
        ) => Promise<string>
        update: (
            annotation: Annotation,
            shareOpts?: AnnotationShareOpts & {
                keepListsIfUnsharing?: boolean
                skipPrivacyLevelUpdate?: boolean
            },
        ) => Promise<void>
        updateTags: (
            annotationUrl: CachedAnnotation['url'],
            tags: CachedAnnotation['tags'],
        ) => Promise<void>
        updateLists: (
            annotationUrl: CachedAnnotation['url'],
            prevLists: CachedAnnotation['lists'],
            nextLists: CachedAnnotation['lists'],
            options?: { protectAnnotation?: boolean },
        ) => Promise<AnnotationSharingState>
        delete: (annotation: Annotation) => Promise<void>
        loadPageData: (
            pageUrl: string,
        ) => Promise<{
            url: string
            sharedLists: number[]
            privateLists: number[]
        }>
        loadListData: () => Promise<{
            [listId: number]: { name: string; remoteId: string | null }
        }>
    }
}

export interface AnnotationsCacheInterface {
    load: (
        pageUrl: string,
        args?: { limit?: number; skip?: number },
    ) => Promise<void>
    create: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
        shareOpts: AnnotationShareOpts,
    ) => Promise<CachedAnnotation>
    update: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
        shareOpts?: AnnotationShareOpts & {
            skipBackendOps?: boolean
            keepListsIfUnsharing?: boolean
            skipPrivacyLevelUpdate?: boolean
            skipBackendListUpdateOp?: boolean
        },
    ) => Promise<void>
    delete: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
    ) => Promise<void>
    sort: (sortingFn?: AnnotationsSorter) => void
    getAnnotationById: (id: string) => CachedAnnotation | null
    getAnnotationByRemoteId: (
        remoteId: string | number,
    ) => CachedAnnotation | null
    updateLists: (
        args: ModifiedList & {
            annotationId: string
            options?: { protectAnnotation?: boolean }
        },
    ) => Promise<void>
    /** NOTE: This is a state-only operation. No backend side-effects should occur. */
    updatePublicAnnotationLists: (args: ModifiedList) => Promise<void>
    addNewListData: (list: {
        name: string
        id: number
        remoteId: string | null
    }) => void
    setAnnotations: (annotations: CachedAnnotation[]) => void

    annotations: CachedAnnotation[]
    listData: { [listId: number]: { name: string; remoteId: string | null } }
    readonly highlights: CachedAnnotation[]
    annotationChanges: AnnotationCacheChangeEvents
    readonly parentPageSharedListIds: Set<number>
    isEmpty: boolean
}

export class AnnotationsCache implements AnnotationsCacheInterface {
    private _annotations: CachedAnnotation[] = []
    public parentPageSharedListIds: AnnotationsCacheInterface['parentPageSharedListIds'] = new Set()
    public readonly annotationChanges = new EventEmitter() as AnnotationCacheChangeEvents
    public listData: AnnotationsCacheInterface['listData'] = {}

    private static updateAnnotationLists(
        args: ModifiedList & {
            listIds: number[]
        },
    ): number[] {
        const listIds = new Set(args.listIds)
        if (args.added != null) {
            listIds.add(args.added)
        } else if (args.deleted != null) {
            listIds.delete(args.deleted)
        }
        return [...listIds]
    }

    private static updatePublicAnnotationLists(
        args: ModifiedList & {
            state: CachedAnnotation[]
            baseAnnotIndex?: number
        },
    ): CachedAnnotation[] {
        const publicAnnotIndices = args.state
            .map((_, i) => i)
            .filter(
                (i) =>
                    args.state[i].isShared && i !== (args.baseAnnotIndex ?? -1),
            )

        for (const i of publicAnnotIndices) {
            const annot = args.state[i]
            annot.lists = AnnotationsCache.updateAnnotationLists({
                listIds: annot.lists,
                deleted: args.deleted,
                added: args.added,
            })
        }

        return args.state
    }

    constructor(private dependencies: AnnotationsCacheDependencies) {}

    set annotations(annotations: CachedAnnotation[]) {
        this._annotations = formatAnnotations(annotations)
    }

    get annotations(): CachedAnnotation[] {
        return this._annotations
    }

    get highlights(): CachedAnnotation[] {
        return this.annotations.filter((a) => a.body?.length > 0)
    }

    get isEmpty(): boolean {
        return this._annotations.length === 0
    }

    getAnnotationById = (id: string): CachedAnnotation =>
        this.annotations.find((annot) => annot.url === id) ?? null

    getAnnotationByRemoteId = (remoteId: string | number): CachedAnnotation =>
        this.annotations.find((annot) => annot.remoteId === remoteId) ?? null

    setAnnotations: AnnotationsCacheInterface['setAnnotations'] = (
        annotations,
    ) => {
        this.annotations = annotations
        this.annotationChanges.emit('newStateIntent', this.annotations)
        this.annotationChanges.emit('newState', this.annotations)
    }

    load = async (url: string, args = {}) => {
        const { backendOperations } = this.dependencies

        const [annotations, { sharedLists }] = await Promise.all([
            backendOperations.load(url, args),
            backendOperations.loadPageData(url),
        ])
        sharedLists.forEach((listId) =>
            this.parentPageSharedListIds.add(listId),
        )

        for (const annotation of annotations) {
            if (annotation.isShared) {
                annotation.lists = Array.from(
                    new Set([...sharedLists, ...annotation.lists]),
                )
            }
        }

        if (Object.keys(this.listData).length === 0) {
            this.listData = await backendOperations.loadListData()
        }

        this.annotations = annotations.sort(this.dependencies.sortingFn)
        this.annotationChanges.emit('load', this._annotations)
        this.annotationChanges.emit('newStateIntent', this.annotations)
        this.annotationChanges.emit('newState', this.annotations)
    }

    sort = (sortingFn?: AnnotationsSorter) => {
        if (sortingFn) {
            this.dependencies.sortingFn = sortingFn
        }

        this._annotations = this._annotations.sort(this.dependencies.sortingFn)
        this.annotationChanges.emit('sorted', this._annotations)
        this.annotationChanges.emit('newStateIntent', this.annotations)
        this.annotationChanges.emit('newState', this.annotations)
    }

    create: AnnotationsCacheInterface['create'] = async (
        annotation,
        shareOpts,
    ) => {
        const { backendOperations } = this.dependencies
        const stateBeforeModifications = this._annotations

        const annotCreatePromise = backendOperations.create(
            annotation,
            shareOpts,
        )
        // NOTE: we're separating the lists from the annotation to avoid confusing them with the lists we potentially need to inherit from the parent page (if annot is to be shared)
        const baseLists = [...annotation.lists]

        const nextAnnotation: CachedAnnotation = {
            ...annotation,
            createdWhen: new Date(),
            isShared: shareOpts?.shouldShare,
            isBulkShareProtected: shareOpts?.isBulkShareProtected,
            remoteId: null,
        }

        if (shareOpts?.shouldShare) {
            const pageData = await backendOperations.loadPageData(
                nextAnnotation.pageUrl,
            )
            nextAnnotation.lists.push(...pageData.sharedLists)
        }

        this.annotations = [nextAnnotation, ...stateBeforeModifications]

        this.annotationChanges.emit('newStateIntent', this.annotations)

        const annotUrl = await annotCreatePromise
        if (annotation.tags.length) {
            await backendOperations.updateTags(annotUrl, annotation.tags)
        }

        if (baseLists.length) {
            await backendOperations.updateLists(annotUrl, [], baseLists)
        }

        this.annotationChanges.emit('created', nextAnnotation)
        this.annotationChanges.emit('newState', this.annotations)

        return nextAnnotation
    }

    update: AnnotationsCacheInterface['update'] = async (
        annotation,
        shareOpts,
    ) => {
        const { backendOperations } = this.dependencies
        const stateBeforeModifications = [...this._annotations]
        const resultIndex = stateBeforeModifications.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )
        const previousAnnotation = stateBeforeModifications[resultIndex]

        const nextAnnotation: CachedAnnotation = {
            ...annotation,
            lastEdited: new Date(),
            isShared: shareOpts?.shouldShare ?? previousAnnotation.isShared,
            isBulkShareProtected:
                shareOpts?.isBulkShareProtected ??
                previousAnnotation.isBulkShareProtected,
            remoteId: previousAnnotation.remoteId,
        }

        this.annotationChanges.emit('newStateIntent', [
            ...stateBeforeModifications.slice(0, resultIndex),
            nextAnnotation,
            ...stateBeforeModifications.slice(resultIndex + 1),
        ])

        // Tags
        if (
            !shareOpts?.skipBackendOps &&
            haveArraysChanged(previousAnnotation.tags ?? [], annotation.tags)
        ) {
            await backendOperations.updateTags(annotation.url, annotation.tags)
        }

        // Lists
        if (
            !shareOpts?.skipBackendOps &&
            !shareOpts?.skipBackendListUpdateOp &&
            haveArraysChanged(previousAnnotation.lists, annotation.lists)
        ) {
            const sharingState = await backendOperations.updateLists(
                annotation.url,
                previousAnnotation.lists,
                annotation.lists,
            )
            const parsedPrivacyLevel = maybeGetAnnotationPrivacyState(
                sharingState?.privacyLevel,
            )
            nextAnnotation.isShared =
                shareOpts?.shouldShare ?? parsedPrivacyLevel.public
            nextAnnotation.isBulkShareProtected =
                shareOpts?.isBulkShareProtected ?? parsedPrivacyLevel.protected
        }

        this.annotations = [
            ...stateBeforeModifications.slice(0, resultIndex),
            nextAnnotation,
            ...stateBeforeModifications.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('updated', nextAnnotation)
        this.annotationChanges.emit('newState', this.annotations)

        try {
            const hasAnnotationChanged =
                previousAnnotation.comment?.trim() !==
                    nextAnnotation.comment?.trim() ||
                previousAnnotation.isShared !== nextAnnotation.isShared ||
                previousAnnotation.isBulkShareProtected !==
                    nextAnnotation.isBulkShareProtected

            if (!shareOpts?.skipBackendOps && hasAnnotationChanged) {
                await backendOperations.update(nextAnnotation, shareOpts)
            }
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    delete = async (annotation: CachedAnnotation) => {
        const stateBeforeModifications = this._annotations

        const resultIndex = this._annotations.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this.annotations = [
            ...this._annotations.slice(0, resultIndex),
            ...this._annotations.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('deleted', annotation)
        this.annotationChanges.emit('newStateIntent', this.annotations)
        this.annotationChanges.emit('newState', this.annotations)

        try {
            await this.dependencies.backendOperations.delete(annotation)
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    updateLists: AnnotationsCacheInterface['updateLists'] = async ({
        annotationId,
        added,
        deleted,
        options,
    }) => {
        const stateBeforeModifications = [...this._annotations]
        let nextState = [...stateBeforeModifications.map((a) => ({ ...a }))]
        const annotationIndex = stateBeforeModifications.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotationId,
        )
        if (annotationIndex === -1) {
            return
        }

        const previousAnnotation = stateBeforeModifications[annotationIndex]
        const nextAnnotation = nextState[annotationIndex]

        nextAnnotation.isShared = options?.protectAnnotation
            ? false
            : previousAnnotation.isShared
        nextAnnotation.isBulkShareProtected =
            options?.protectAnnotation ??
            previousAnnotation.isBulkShareProtected

        nextAnnotation.lists = AnnotationsCache.updateAnnotationLists({
            added,
            deleted,
            listIds: nextAnnotation.lists,
        })

        if (this.isModifiedListShared({ added, deleted })) {
            if (added === null) {
                this.parentPageSharedListIds.delete(deleted)
            } else if (deleted == null) {
                this.parentPageSharedListIds.add(added)
                nextState = AnnotationsCache.updatePublicAnnotationLists({
                    added,
                    deleted,
                    state: nextState,
                    baseAnnotIndex: annotationIndex,
                })
            }
        }

        this.annotationChanges.emit('newStateIntent', nextState)

        try {
            const sharingState = await this.dependencies.backendOperations.updateLists(
                annotationId,
                previousAnnotation.lists,
                nextAnnotation.lists,
                { protectAnnotation: options?.protectAnnotation },
            )

            const parsedPrivacyLevel = maybeGetAnnotationPrivacyState(
                sharingState?.privacyLevel,
            )
            nextAnnotation.isShared = parsedPrivacyLevel.public
            nextAnnotation.isBulkShareProtected = parsedPrivacyLevel.protected

            this.annotations = nextState
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }

        this.annotationChanges.emit('newState', this.annotations)
    }

    updatePublicAnnotationLists: AnnotationsCacheInterface['updatePublicAnnotationLists'] = async ({
        added,
        deleted,
    }) => {
        if (!this.isModifiedListShared({ added, deleted })) {
            return
        }

        const state = AnnotationsCache.updatePublicAnnotationLists({
            state: [...this._annotations],
            added,
            deleted,
        })
        this.annotationChanges.emit('newStateIntent', state)
        this.annotationChanges.emit('newState', state)

        this.annotations = state
    }

    addNewListData: AnnotationsCacheInterface['addNewListData'] = (list) => {
        this.listData[list.id] = { name: list.name, remoteId: list.remoteId }
    }

    private isModifiedListShared = ({
        added,
        deleted,
    }: ModifiedList): boolean =>
        this.listData[added ?? deleted]?.remoteId != null
}

function formatAnnotations(
    annotations: CachedAnnotation[],
): CachedAnnotation[] {
    return annotations.map((a) => ({
        ...a,
        tags: a.tags ?? [],
        isBookmarked: a.isBookmarked ?? false,
    }))
}
