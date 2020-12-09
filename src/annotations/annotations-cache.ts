import TypedEventEmitter from 'typed-emitter'
import { EventEmitter } from 'events'

import { Annotation } from 'src/annotations/types'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'
import {
    AnnotationsSorter,
    sortByPagePosition,
} from 'src/sidebar/annotations-sidebar/sorting'
import { haveTagsChanged } from 'src/util/have-tags-changed'

export const createAnnotationsCache = (
    bgModules: {
        tags: RemoteTagsInterface
        annotations: AnnotationInterface<'caller'>
    },
    options: { skipPageIndexing?: boolean } = {},
): AnnotationsCache =>
    new AnnotationsCache({
        sortingFn: sortByPagePosition,
        backendOperations: {
            load: async (pageUrl) =>
                bgModules.annotations.listAnnotationsByPageUrl({ pageUrl }),
            create: async (annotation) =>
                bgModules.annotations.createAnnotation(annotation, {
                    skipPageIndexing: options.skipPageIndexing,
                }),
            update: async (annotation) => {
                await bgModules.annotations.updateAnnotationBookmark({
                    url: annotation.url,
                    isBookmarked: annotation.isBookmarked,
                })

                return bgModules.annotations.editAnnotation(
                    annotation.url,
                    annotation.comment,
                )
            },
            delete: async (annotation) =>
                bgModules.annotations.deleteAnnotation(annotation.url),
            updateTags: async (annotationUrl, tags) =>
                bgModules.tags.setTagsForAnnotation({
                    url: annotationUrl,
                    tags,
                }),
        },
    })

interface AnnotationCacheChanges {
    rollback: (annotations: Annotation[]) => void
    newState: (annotation: Annotation[]) => void
    sorted: (annotations: Annotation[]) => void
    created: (annotation: Annotation) => void
    updated: (annotation: Annotation) => void
    deleted: (annotation: Annotation) => void
    load: (annotation: Annotation[]) => void
}

export type AnnotationCacheChangeEvents = TypedEventEmitter<
    AnnotationCacheChanges
>

export interface AnnotationsCacheDependencies {
    sortingFn: AnnotationsSorter
    backendOperations?: {
        load: (
            pageUrl: string,
            args?: { limit?: number; skip?: number },
        ) => Promise<Annotation[]> // url should become one concrete example of a contentFingerprint to load annotations for
        create: (annotation: Annotation) => Promise<string>
        update: (annotation: Annotation) => Promise<void>
        updateTags: (
            annotationUrl: Annotation['url'],
            tags: Annotation['tags'],
        ) => Promise<void>
        delete: (annotation: Annotation) => Promise<void>
    }
}

export interface AnnotationsCacheInterface {
    load: (
        pageUrl: string,
        args?: { limit?: number; skip?: number },
    ) => Promise<void>
    create: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
    ) => Promise<void>
    update: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
    ) => Promise<void>
    delete: (
        annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>,
    ) => Promise<void>
    sort: (sortingFn?: AnnotationsSorter) => void

    annotations: Annotation[]
    annotationChanges: AnnotationCacheChangeEvents
    isEmpty: boolean
}

export class AnnotationsCache implements AnnotationsCacheInterface {
    private _annotations: Annotation[] = []
    public annotationChanges = new EventEmitter() as AnnotationCacheChangeEvents

    constructor(private dependencies: AnnotationsCacheDependencies) {}

    set annotations(annotations: Annotation[]) {
        this._annotations = formatAnnotations(annotations)
    }

    get annotations(): Annotation[] {
        return this._annotations
    }

    get isEmpty(): boolean {
        return this._annotations.length === 0
    }

    load = async (url, args = {}) => {
        const annotations = await this.dependencies.backendOperations.load(
            url,
            args,
        )

        this.annotations = annotations.sort(this.dependencies.sortingFn)
        this.annotationChanges.emit('load', this._annotations)
        this.annotationChanges.emit('newState', this._annotations)
    }

    sort = (sortingFn?: AnnotationsSorter) => {
        if (sortingFn) {
            this.dependencies.sortingFn = sortingFn
        }

        this._annotations = this._annotations.sort(this.dependencies.sortingFn)
        this.annotationChanges.emit('sorted', this._annotations)
        this.annotationChanges.emit('newState', this._annotations)
    }

    create = async (annotation: Annotation) => {
        annotation.createdWhen = new Date()
        const { backendOperations } = this.dependencies
        const stateBeforeModifications = this._annotations

        this.annotations = [annotation, ...stateBeforeModifications]

        this.annotationChanges.emit('created', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        try {
            const annotUrl = await backendOperations.create(annotation)

            if (annotation.tags.length) {
                await backendOperations.updateTags(annotUrl, annotation.tags)
            }
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    update = async (annotation: Annotation) => {
        annotation.lastEdited = new Date()
        const stateBeforeModifications = [...this._annotations]

        const resultIndex = stateBeforeModifications.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this.annotations = [
            ...stateBeforeModifications.slice(0, resultIndex),
            annotation,
            ...stateBeforeModifications.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('updated', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        try {
            await this.dependencies.backendOperations.update(annotation)

            if (
                haveTagsChanged(
                    stateBeforeModifications[resultIndex]?.tags ?? [],
                    annotation.tags,
                )
            ) {
                await this.dependencies.backendOperations.updateTags(
                    annotation.url,
                    annotation.tags,
                )
            }
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    delete = async (annotation: Annotation) => {
        const stateBeforeModifications = this._annotations

        const resultIndex = this._annotations.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this.annotations = [
            ...this._annotations.slice(0, resultIndex),
            ...this._annotations.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('deleted', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        try {
            await this.dependencies.backendOperations.delete(annotation)
        } catch (e) {
            this._annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }
}

function formatAnnotations(annotations: Annotation[]): Annotation[] {
    return annotations.map((a) => ({
        ...a,
        tags: a.tags ?? [],
        isBookmarked: a.isBookmarked ?? false,
    }))
}
