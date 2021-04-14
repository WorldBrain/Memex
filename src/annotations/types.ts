import { Anchor } from 'src/highlighting/types'

// export interface Annotation {
//     /** Unique URL for this annotation. Used as more of an ID; probably not for display. */
//     url: string
//     /** URL for display. */
//     pageUrl: string
//     /** Defined for annotations with highlighted text. */
//     body?: string
//     /** Defined for annotations with a user comment. */
//     comment?: string
//     /** Selector required for highlighting annotations. */
//     selector?: Anchor
//     createdWhen: number
//     lastEdited: number
//     tags: string[]
//     hasBookmark?: boolean
// }

export interface Annotation {
    url: string
    pageTitle?: string
    pageUrl: string
    body?: string
    selector?: Anchor
    createdWhen?: Date
    lastEdited?: Date
    comment?: string
    _body_terms?: string[]
    _comment_terms?: string[]
    isBookmarked?: boolean
    privacyLevel?: AnnotationPrivacyLevels
    tags: string[]
    isSocialPost?: boolean
}

export interface AnnotationPrivacyLevel {
    annotation: string
    privacyLevel: AnnotationPrivacyLevels
    createdWhen: Date
    updatedWhen?: Date
}

export interface NewAnnotationOptions {
    anchor?: Anchor
    text: string
    tags: string[]
    isBookmarked?: boolean
}

export interface AnnotationsManagerInterface {
    createAnnotation(input: {
        pageUrl: string
        pageTitle: string
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

export interface SidebarAnnotationTheme {
    hasHighlight: boolean
    hasComment: boolean
    isEditing: boolean
    isActive: boolean
    cursor: 'pointer' | 'auto'
}

export interface AnnotListEntry {
    listId: number
    url: string
}

export interface AnnotationRequest {
    memexLinkOrigin: string
    // urlWithoutProtocol: string
    annotationId: string
    tabId: string
}

interface StoredAnnotationRequest extends AnnotationRequest {
    annotationPromise: Promise<Annotation>
}

export interface StoredAnnotationRequestMap {
    [tabId: string]: StoredAnnotationRequest
}

export type AnnotationSender = ({
    annotation,
    tabId,
}: {
    annotation: Annotation
    tabId: number
}) => void

export type TextTruncator = (
    text: string,
    opts?: { maxLength?: number; maxLineBreaks?: number },
) => { text: string; isTooLong: boolean }

export type SelectionIndices = [number, number]

export enum AnnotationPrivacyLevels {
    PRIVATE = 0,
    PROTECTED = 100,
    SHARED = 200,
}
