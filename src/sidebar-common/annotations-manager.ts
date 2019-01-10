import { remoteFunction } from '../util/webextensionRPC'
import { Anchor } from '../direct-linking/content_script/interactions'
import { Annotation, Omit } from './types'
import { EVENT_NAMES } from '../analytics/internal/constants'

export default class AnnotationsManager {
    private readonly _processEventRPC = remoteFunction('processEvent')
    private readonly _createAnnotationRPC = remoteFunction('createAnnotation')
    private readonly _addAnnotationTagRPC = remoteFunction('addAnnotationTag')
    private readonly _getAllAnnotationsByUrlRPC = remoteFunction(
        'getAllAnnotationsByUrl',
    )
    private readonly _getTagsByAnnotationUrlRPC = remoteFunction(
        'getTagsByAnnotationUrl',
    )
    private readonly _editAnnotationRPC = remoteFunction('editAnnotation')
    private readonly _editAnnotationTagsRPC = remoteFunction(
        'editAnnotationTags',
    )
    private readonly _deleteAnnotationRPC = remoteFunction('deleteAnnotation')

    public createAnnotation = async ({
        url,
        title,
        body,
        comment,
        anchor,
        tags,
    }: {
        url: string
        title: string
        body: string
        comment: string
        anchor: Anchor
        tags: string[]
    }) => {
        this._processEventRPC({ type: 'createAnnotation' })

        // Write annotation to database.
        const uniqueUrl = await this._createAnnotationRPC({
            url,
            title,
            body,
            comment,
            selector: anchor,
        })

        // Write tags to database.
        tags.forEach(async tag => {
            await this._addAnnotationTagRPC({ tag, url: uniqueUrl })
        })
    }

    public fetchAnnotationsWithTags = async (url: string) => {
        const annotationsWithoutTags: Omit<
            Annotation,
            'tags'
        >[] = await this._getAllAnnotationsByUrlRPC(url)

        return Promise.all(
            annotationsWithoutTags.map(async annotation => {
                const annotationTags: {
                    name: string
                    url: string
                }[] = await this._getTagsByAnnotationUrlRPC(annotation.url)
                const tags = annotationTags.map(tag => tag.name)
                return {
                    ...annotation,
                    tags,
                }
            }),
        )
    }

    public editAnnotation = async ({
        url,
        comment,
        tags,
    }: {
        url: string
        comment: string
        tags: string[]
    }) => {
        // Get the previously tags for the annotation.
        const prevTags = await this._getTagsByAnnotationUrlRPC(url)

        // Calculate which tags are to be added and which are to be deleted.
        const { tagsToBeAdded, tagsToBeDeleted } = this._getTagArrays(
            prevTags,
            tags,
        )

        // Save the edited annotation to the storage.
        await this._editAnnotationRPC(url, comment)

        // Save the edited tags to the storage.
        await this._editAnnotationTagsRPC({
            tagsToBeAdded,
            tagsToBeDeleted,
            url,
        })
    }

    public deleteAnnotation = async (url: string) => {
        await this._processEventRPC({ type: EVENT_NAMES.DELETE_ANNOTATION })
        await this._deleteAnnotationRPC(url)
    }

    private _getTagArrays: (
        oldTags: string[],
        newTags: string[],
    ) => { tagsToBeAdded: string[]; tagsToBeDeleted: string[] } = (
        oldTags,
        newTags,
    ) => {
        const oldSet = new Set(oldTags)
        const tagsToBeAdded = newTags.reduce((accumulator, currentTag) => {
            if (!oldSet.has(currentTag)) {
                accumulator.push(currentTag)
            }
            return accumulator
        }, [])

        const newSet = new Set(newTags)
        const tagsToBeDeleted = oldTags.reduce((accumulator, currentTag) => {
            if (!newSet.has(currentTag)) {
                accumulator.push(currentTag)
            }
            return accumulator
        }, [])

        return {
            tagsToBeAdded,
            tagsToBeDeleted,
        }
    }
}
