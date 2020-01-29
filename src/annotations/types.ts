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
    selector: Anchor
    createdWhen: number
    lastEdited: number
    tags: string[]
    hasBookmark?: boolean
}
