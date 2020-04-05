import { Anchor } from 'src/highlighting/types'

export interface Annotation {
    pageTitle: string
    pageUrl: string
    body?: string
    selector?: Anchor
    createdWhen?: Date
    lastEdited?: Date
    url: string
    comment?: string
    _body_terms?: string[]
    _comment_terms?: string[]
    hasBookmark?: boolean
    tags?: string[]
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
