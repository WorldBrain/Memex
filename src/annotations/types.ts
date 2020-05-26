import { Anchor } from 'src/highlighting/types'

export interface Annotation {
    /** Unique URL for this annotation. Used as more of an ID; probably not for display. */
    url: string
    /** URL for display. */
    pageUrl: string
    /** Defined for annotations with highlighted text. */
    body?: string
    /** Defined for annotations with a user comment. */
    comment?: string
    /** Selector required for highlighting annotations. */
    selector?: Anchor
    createdWhen: number
    lastEdited: number
    tags: string[]
    hasBookmark?: boolean
}

export interface AnnotationsManagerInterface {
    createAnnotation(input: {
        url: string
        title: string
        body: string
        comment: string
        anchor: Anchor
        tags: string[]
        bookmarked?: boolean
        isSocialPost?: boolean
    }): Promise<Annotation>
    fetchAnnotationsWithTags(
        url: string,
        // limit = 10,
        // skip = 0,
        isSocialPost?: boolean,
    ): Promise<Annotation[]>
}
