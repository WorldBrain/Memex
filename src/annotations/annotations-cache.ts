import { Annotation } from 'src/annotations/types'
import TypedEventEmitter from 'typed-emitter'

export interface AnnotationCacheChanges {
    created: (annotation: Annotation) => void
    updated: (annotation: Annotation) => void
    deleted: (annotation: Annotation) => void
    newState: (annotation: Annotation[]) => void
    rollback: (annotations: Annotation[]) => void
}

export interface AnnotationsCacheDependencies {
    backendOperations?: {
        create?: (annotation: Annotation) => Promise<void>
        update?: (annotation: Annotation) => Promise<void>
        updateTags?: (
            annotationUrl: Annotation['url'],
            tags: Annotation['tags'],
        ) => Promise<void>
        delete?: (annotation: Annotation) => Promise<void>
    }
}

export class AnnotationsCache {
    private annotations: Annotation[]
    public annotationChanges: TypedEventEmitter<AnnotationCacheChanges>

    constructor(private dependencies: AnnotationsCacheDependencies) {}

    create = (annotation: Annotation) => {
        const stateBeforeModifications = this.annotations
        this.annotations.push(annotation)
        this.annotationChanges.emit('created', annotation)
        this.annotationChanges.emit('newState', this.annotations)
        try {
            this.dependencies.backendOperations?.create?.(annotation)
        } catch (e) {
            this.annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    update = (annotation: Annotation) => {
        const stateBeforeModifications = this.annotations

        const resultIndex = this.annotations.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this.annotations = [
            ...this.annotations.slice(0, resultIndex),
            annotation,
            ...this.annotations.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('updated', annotation)
        this.annotationChanges.emit('newState', this.annotations)

        try {
            this.dependencies.backendOperations?.update?.(annotation)
            this.dependencies.backendOperations?.updateTags?.(
                annotation.url,
                annotation.tags,
            )
        } catch (e) {
            this.annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }

    delete = (annotation: Annotation) => {
        const stateBeforeModifications = this.annotations

        const resultIndex = this.annotations.findIndex(
            (existingAnnotation) => existingAnnotation.url === annotation.url,
        )

        this.annotations = [
            ...this.annotations.slice(0, resultIndex),
            ...this.annotations.slice(resultIndex + 1),
        ]

        this.annotationChanges.emit('deleted', annotation)
        this.annotationChanges.emit('newState', this.annotations)

        try {
            this.dependencies.backendOperations?.delete?.(annotation)
        } catch (e) {
            this.annotations = stateBeforeModifications
            this.annotationChanges.emit('rollback', stateBeforeModifications)
            throw e
        }
    }
}
