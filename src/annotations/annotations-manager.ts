import { remoteFunction } from 'src/util/webextensionRPC'
import { Omit } from '../sidebar-overlay/types'
import { EVENT_NAMES } from 'src/analytics/internal/constants'
import analytics from 'src/analytics'
import { BackgroundSearchParams } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'
import { Annotation, AnnotationsManagerInterface } from 'src/annotations/types'

export default class AnnotationsManager implements AnnotationsManagerInterface {
    private _isSetUp = false
    _processEventRPC: (...args: any[]) => Promise<any>
    _createAnnotationRPC: (...args: any[]) => Promise<any>
    _addAnnotationTagRPC: (...args: any[]) => Promise<any>
    _getAllAnnotationsByUrlRPC: (...args: any[]) => Promise<any>
    _getTagsByAnnotationUrlRPC: (...args: any[]) => Promise<any>
    _editAnnotationRPC: (...args: any[]) => Promise<any>
    _editAnnotationTagsRPC: (...args: any[]) => Promise<any>
    _deleteAnnotationRPC: (...args: any[]) => Promise<any>
    _bookmarkAnnotationRPC: (...args: any[]) => Promise<any>
    _searchAnnotationsRPC: (...args: any[]) => Promise<any>

    _setupRPC() {
        if (this._isSetUp) {
            return
        }
        this._isSetUp = true

        this._processEventRPC = remoteFunction('processEvent')
        this._createAnnotationRPC = remoteFunction('createAnnotation')
        this._addAnnotationTagRPC = remoteFunction('addAnnotationTag')
        this._getAllAnnotationsByUrlRPC = remoteFunction(
            'getAllAnnotationsByUrl',
        )
        this._getTagsByAnnotationUrlRPC = remoteFunction('getAnnotationTags')
        this._editAnnotationRPC = remoteFunction('editAnnotation')
        this._editAnnotationTagsRPC = remoteFunction('editAnnotationTags')
        this._deleteAnnotationRPC = remoteFunction('deleteAnnotation')
        this._bookmarkAnnotationRPC = remoteFunction('toggleAnnotBookmark')
        this._searchAnnotationsRPC = remoteFunction('searchAnnotations')
    }

    public createAnnotation = async ({
        url,
        // pdfFingerprint,
        title,
        body,
        comment,
        anchor,
        tags,
        bookmarked,
        isSocialPost,
    }: {
        url: string
        // pdfFingerprint: string | null
        title: string
        body: string
        comment: string
        anchor: Anchor
        tags: string[]
        bookmarked?: boolean
        isSocialPost?: boolean
    }) => {
        this._setupRPC()
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
            // pdfFingerprint,
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
        tags.forEach(async (tag) => {
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
    ): Promise<Annotation[]> => {
        return this._getAllAnnotationsByUrlRPC(
            {
                url,
                // limit,
                // skip,
            },
            isSocialPost,
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
        this._setupRPC()

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
        this._setupRPC()

        await this._processEventRPC({ type: EVENT_NAMES.DELETE_ANNOTATION })
        await this._deleteAnnotationRPC(url, isSocialPost)
    }

    public toggleBookmark = async (url: string) => {
        this._setupRPC()
        return this._bookmarkAnnotationRPC({ url })
    }

    public searchAnnotations = async (searchParams: BackgroundSearchParams) => {
        this._setupRPC()
        const annotations = await this._searchAnnotationsRPC(searchParams)
        return annotations
    }

    private _getTagArrays: (
        oldTags: string[],
        newTags: string[],
    ) => { tagsToBeAdded: string[]; tagsToBeDeleted: string[] } = (
        oldTags,
        newTags,
    ) => {
        this._setupRPC()
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
