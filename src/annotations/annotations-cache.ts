import { Annotation } from 'src/annotations/types'
import TypedEventEmitter from 'typed-emitter'
import { Observable } from 'rxjs'
import { EventEmitter } from 'events'
import { RemoteTagsInterface } from 'src/tags/background/types'
import { AnnotationInterface } from 'src/annotations/background/types'

export const createAnnotationsCache = (bgModules: {
    tags: RemoteTagsInterface
    annotations: AnnotationInterface<'caller'>
}): AnnotationsCache =>
    new AnnotationsCache({
        backendOperations: {
            load: async (pageUrl) =>
                bgModules.annotations.listAnnotationsByPageUrl({ pageUrl }),
            create: async (annotation) => {
                await bgModules.annotations.createAnnotation(annotation)
            },
            async update(annotation) {
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
                bgModules.tags.setTagsForPage({ url: annotationUrl, tags }),
        },
    })

interface AnnotationCacheChanges {
    created: (annotation: Annotation) => void
    updated: (annotation: Annotation) => void
    deleted: (annotation: Annotation) => void
    newState: (annotation: Annotation[]) => void
    load: (annotation: Annotation[]) => void
    rollback: (annotations: Annotation[]) => void
}

export type AnnotationCacheChangeEvents = TypedEventEmitter<
    AnnotationCacheChanges
>

export interface AnnotationsCacheDependencies {
    backendOperations?: {
        load: (
            pageUrl: string,
            args?: { limit?: number; skip?: number },
        ) => Promise<Annotation[]> // url should become one concrete example of a contentFingerprint to load annotations for
        create: (annotation: Annotation) => Promise<void>
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
    create: (annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>) => void
    update: (annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>) => void
    delete: (annotation: Omit<Annotation, 'lastEdited' | 'createdWhen'>) => void

    annotations: Annotation[]
    annotationChanges: AnnotationCacheChangeEvents
    isEmpty: boolean
}

export class AnnotationsCache implements AnnotationsCacheInterface {
    private _annotations: Annotation[] = []
    public annotationChanges = new EventEmitter() as AnnotationCacheChangeEvents

    constructor(private dependencies: AnnotationsCacheDependencies) {}

    load = async (url, args = {}) => {
        this._annotations = await this.dependencies.backendOperations.load(
            url,
            args,
        )
        this.annotationChanges.emit('load', this._annotations)
        this.annotationChanges.emit('newState', this._annotations)
    }

    get annotations() {
        return this._annotations
    }
    get isEmpty() {
        return this._annotations.length === 0
    }

    create = (annotation: Annotation) => {
        const stateBeforeModifications = this._annotations
        this._annotations.push(annotation)
        this.annotationChanges.emit('created', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        const asyncUpstream = async () => {
            try {
                await this.dependencies.backendOperations.create(annotation)
            } catch (e) {
                this._annotations = stateBeforeModifications
                this.annotationChanges.emit(
                    'rollback',
                    stateBeforeModifications,
                )
                throw e
            }
        }
        asyncUpstream().then(() => true)
    }

    update = (annotation: Annotation) => {
        const stateBeforeModifications = this._annotations

        const resultIndex = stateBeforeModifications.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this._annotations = [
            ...stateBeforeModifications.slice(0, resultIndex),
            annotation,
            ...stateBeforeModifications.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('updated', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        const asyncUpstream = async () => {
            try {
                await this.dependencies.backendOperations.update(annotation)
                await this.dependencies.backendOperations.updateTags(
                    annotation.url,
                    annotation.tags,
                )
            } catch (e) {
                this._annotations = stateBeforeModifications
                this.annotationChanges.emit(
                    'rollback',
                    stateBeforeModifications,
                )
                throw e
            }
        }
        asyncUpstream().then(() => true)
    }

    delete = (annotation: Annotation) => {
        const stateBeforeModifications = this._annotations

        const resultIndex = this._annotations.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this._annotations = [
            ...this._annotations.slice(0, resultIndex),
            ...this._annotations.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('deleted', annotation)
        this.annotationChanges.emit('newState', this._annotations)

        const asyncUpstream = async () => {
            try {
                await this.dependencies.backendOperations.delete(annotation)
            } catch (e) {
                this._annotations = stateBeforeModifications
                this.annotationChanges.emit(
                    'rollback',
                    stateBeforeModifications,
                )
                throw e
            }
        }
        asyncUpstream().then(() => true)
    }
}
