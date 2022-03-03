import type TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'

import { Annotation } from 'src/annotations/types'
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

export type CachedAnnotation = Annotation

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
                const privacyLevels = await bgModules.contentSharing.findAnnotationPrivacyLevels(
                    {
                        annotationUrls,
                    },
                )

                return annotations.map((a) => ({
                    ...a,
                    isShared: [
                        AnnotationPrivacyLevels.SHARED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(privacyLevels[a.url]),
                    isBulkShareProtected: [
                        AnnotationPrivacyLevels.PROTECTED,
                        AnnotationPrivacyLevels.SHARED_PROTECTED,
                    ].includes(privacyLevels[a.url]),
                }))
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
            updateLists: async (annotationUrl, listIds, options) => {
                const existingListIds = await bgModules.annotations.getListIdsForAnnotation(
                    { annotationId: annotationUrl },
                )

                const listsToAdd = listIds.filter(
                    (list) => !existingListIds.includes(list),
                )
                const listsToDelete = existingListIds.filter(
                    (list) => !listIds.includes(list),
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
                if (listsToDelete.length) {
                    const result = await bgModules.contentSharing.unshareAnnotationFromSomeLists(
                        {
                            annotationUrl,
                            localListIds: listsToDelete,
                        },
                    )
                    sharingState = result.sharingState
                }
                return sharingState
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

export type AnnotationCacheChangeEvents = TypedEventEmitter<
    AnnotationCacheChanges
>

export interface AnnotationsCacheDependencies {
    getListFromId: (id: number) => Promise<PageList>
    sortingFn: AnnotationsSorter
    backendOperations?: {
        load: (
            pageUrl: string,
            args?: { limit?: number; skip?: number },
        ) => Promise<CachedAnnotation[]> // url should become one concrete example of a contentFingerprint to load annotations for
        create: (
            annotation: CachedAnnotation,
            shareOpts?: AnnotationShareOpts,
        ) => Promise<string>
        update: (
            annotation: CachedAnnotation,
            shareOpts?: AnnotationShareOpts,
        ) => Promise<void>
        updateTags: (
            annotationUrl: CachedAnnotation['url'],
            tags: CachedAnnotation['tags'],
        ) => Promise<void>
        updateLists: (
            annotationUrl: CachedAnnotation['url'],
            lists: CachedAnnotation['lists'],
            options?: { protectAnnotation?: boolean },
        ) => Promise<AnnotationSharingState>
        delete: (annotation: CachedAnnotation) => Promise<void>
    }
}

export interface AnnotationsCacheInterface {
    load: (
        pageUrl: string,
        args?: { limit?: number; skip?: number },
    ) => Promise<void>
    create: (
        annotation: Omit<CachedAnnotation, 'lastEdited' | 'createdWhen'>,
        shareOpts: AnnotationShareOpts,
    ) => Promise<Annotation>
    update: (
        annotation: Omit<CachedAnnotation, 'lastEdited' | 'createdWhen'>,
        shareOpts?: AnnotationShareOpts & {
            skipBackendOps?: boolean
            skipBackendListUpdateOp?: boolean
        },
    ) => Promise<void>
    delete: (
        annotation: Omit<CachedAnnotation, 'lastEdited' | 'createdWhen'>,
    ) => Promise<void>
    sort: (sortingFn?: AnnotationsSorter) => void
    getAnnotationById: (id: string) => CachedAnnotation | null
    updateLists: (args: {
        added: number | null
        deleted: number | null
        annotationId: string
        options?: { protectAnnotation?: boolean }
    }) => Promise<void>

    annotations: CachedAnnotation[]
    readonly highlights: CachedAnnotation[]
    annotationChanges: AnnotationCacheChangeEvents
    isEmpty: boolean
}

export class AnnotationsCache implements AnnotationsCacheInterface {
    private _annotations: CachedAnnotation[] = []
    public annotationChanges = new EventEmitter() as AnnotationCacheChangeEvents

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

    load = async (url: string, args = {}) => {
        const annotations = await this.dependencies.backendOperations.load(
            url,
            args,
        )

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

        const annotUrl = await backendOperations.create(annotation, shareOpts)

        const nextAnnotation: CachedAnnotation = {
            ...annotation,
            createdWhen: new Date(),
            isShared: shareOpts?.shouldShare,
            isBulkShareProtected: shareOpts?.isBulkShareProtected,
        }
        this.annotations = [nextAnnotation, ...stateBeforeModifications]

        this.annotationChanges.emit('newStateIntent', this.annotations)

        if (annotation.tags.length) {
            await backendOperations.updateTags(annotUrl, annotation.tags)
        }

        if (annotation.lists.length) {
            await backendOperations.updateLists(annotUrl, annotation.lists)
        }

        this.annotationChanges.emit('created', nextAnnotation)
        this.annotationChanges.emit('newState', this.annotations)

        return nextAnnotation
    }

    update: AnnotationsCacheInterface['update'] = async (
        annotation,
        shareOpts,
    ) => {
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
            await this.dependencies.backendOperations.updateTags(
                annotation.url,
                annotation.tags,
            )
        }

        // Lists
        if (
            !shareOpts?.skipBackendOps &&
            !shareOpts?.skipBackendListUpdateOp &&
            haveArraysChanged(previousAnnotation.lists, annotation.lists)
        ) {
            const sharingState = await this.dependencies.backendOperations.updateLists(
                annotation.url,
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
                previousAnnotation.comment.trim() !==
                    nextAnnotation.comment.trim() ||
                previousAnnotation.isShared !== nextAnnotation.isShared ||
                previousAnnotation.isBulkShareProtected !==
                    nextAnnotation.isBulkShareProtected

            if (!shareOpts?.skipBackendOps && hasAnnotationChanged) {
                await this.dependencies.backendOperations.update(
                    nextAnnotation,
                    shareOpts,
                )
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
        const nextState = [...stateBeforeModifications]
        const annotIndices = [
            stateBeforeModifications.findIndex(
                (existingAnnotation) => existingAnnotation.url === annotationId,
            ),
        ]
        if (annotIndices[0] === -1) {
            return
        }

        const previousAnnotation = stateBeforeModifications[annotIndices[0]]
        const nextAnnotation = nextState[annotIndices[0]]
        nextAnnotation.isShared = options?.protectAnnotation
            ? false
            : previousAnnotation.isShared
        nextAnnotation.isBulkShareProtected =
            options?.protectAnnotation ??
            previousAnnotation.isBulkShareProtected

        // If not choosing to protect the annot, all other public annots must also have their lists updated in the same way
        if (options?.protectAnnotation === false) {
            const publicAnnotIndices = nextState
                .map((_, i) => i)
                .filter(
                    (i) =>
                        nextState[i].isShared &&
                        nextState[i].url !== annotationId,
                )

            annotIndices.push(...publicAnnotIndices)
        }

        for (const i of annotIndices) {
            const annot = nextState[i]
            const listIds = new Set(annot.lists)

            if (added != null) {
                listIds.add(added)
            } else if (deleted != null) {
                listIds.delete(deleted)
            }
            annot.lists = [...listIds]
        }

        this.annotationChanges.emit('newStateIntent', nextState)

        try {
            const sharingState = await this.dependencies.backendOperations.updateLists(
                annotationId,
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
