import { remoteFunction } from 'src/util/webextensionRPC'
import { Omit } from '../sidebar-overlay/types'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import analytics from 'src/analytics'
import { BackgroundSearchParams } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'
import { Annotation } from 'src/annotations/types'

export default class AnnotationsManager {
    private readonly _processEventRPC = remoteFunction('processEvent')
    private readonly _createAnnotationRPC = remoteFunction('createAnnotation')
    private readonly _addAnnotationTagRPC = remoteFunction('addAnnotationTag')
    private readonly _getAllAnnotationsByUrlRPC = remoteFunction(
        'getAllAnnotationsByUrl',
    )
    private readonly _getTagsByAnnotationUrlRPC = remoteFunction(
        'getAnnotationTags',
    )
    private readonly _editAnnotationRPC = remoteFunction('editAnnotation')
    private readonly _editAnnotationTagsRPC = remoteFunction(
        'editAnnotationTags',
    )
    private readonly _deleteAnnotationRPC = remoteFunction('deleteAnnotation')

    private readonly bookmarkAnnotationRPC = remoteFunction(
        'toggleAnnotBookmark',
    )

    private readonly searchAnnotationsRPC = remoteFunction('searchAnnotations')

    public createAnnotation = async ({
        url,
        title,
        body,
        comment,
        anchor,
        tags,
        bookmarked,
        isSocialPost,
    }: {
        url: string
        title: string
        body: string
        comment: string
        anchor: Anchor
        tags: string[]
        bookmarked?: boolean
        isSocialPost?: boolean
    }) => {
        this._processEventRPC({ type: EVENT_NAMES.CREATE_ANNOTATION })

        if (tags && tags.length) {
            analytics.trackEvent({
                category: 'Annotations',
                action: 'createWithTags',
            })
        } else {
            analytics.trackEvent({
                category: 'Annotations',
                action: 'createWithoutTags',
            })
        }

        const annotation = {
            url,
            title,
            body,
            comment,
            selector: anchor,
            bookmarked,
            isSocialPost,
        }
        // Write annotation to database.
        const uniqueUrl = await this._createAnnotationRPC(annotation)

        // Write tags to database.
        tags.forEach(async tag => {
            await this._addAnnotationTagRPC({ tag, url: uniqueUrl })
        })

        return {
            ...annotation,
            pageUrl: annotation.url,
            url: uniqueUrl, // Weird materialised surrogate key made when creating an annotation for saving.
            tags,
            createdWhen: Date.now(),
            lastEdited: Date.now(),
        } as Annotation
    }

    public fetchAnnotationsWithTags = async (
        url: string,
        // limit = 10,
        // skip = 0,
        isSocialPost?: boolean,
    ) => {
        const annotationsWithoutTags: Omit<
            Annotation,
            'tags'
        >[] = await this._getAllAnnotationsByUrlRPC(
            {
                url,
                // limit,
                // skip,
            },
            isSocialPost,
        )

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
        isSocialPost,
    }: {
        url: string
        comment: string
        tags: string[]
        isSocialPost?: boolean
    }) => {
        // Get the previously tags for the annotation.
        const prevTags = await this._getTagsByAnnotationUrlRPC(url)

        // Calculate which tags are to be added and which are to be deleted.
        const { tagsToBeAdded, tagsToBeDeleted } = this._getTagArrays(
            prevTags,
            tags,
        )

        // Save the edited annotation to the storage.
        await this._editAnnotationRPC(url, comment, isSocialPost)

        // Save the edited tags to the storage.
        await this._editAnnotationTagsRPC({
            tagsToBeAdded,
            tagsToBeDeleted,
            url,
        })

        if (tagsToBeAdded) {
            analytics.trackEvent({
                category: 'Tags',
                action: 'createForAnnotation',
            })
        }
    }

    public deleteAnnotation = async (url: string, isSocialPost?: boolean) => {
        await this._processEventRPC({ type: EVENT_NAMES.DELETE_ANNOTATION })
        await this._deleteAnnotationRPC(url, isSocialPost)
    }

    public toggleBookmark = async (url: string) => {
        return this.bookmarkAnnotationRPC({ url })
    }

    public searchAnnotations = async (searchParams: BackgroundSearchParams) => {
        const annotations = await this.searchAnnotationsRPC(searchParams)
        return annotations
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
