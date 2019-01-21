export interface Annotation {
    pageTitle: string
    pageUrl: string
    body: string
    selector: object
    createdWhen?: Date
    lastEdited?: Date
    url?: string
    comment?: string
}

export interface AnnotPage {
    url: string
    title: string
    hasBookmark: boolean
    /** Object URL to the in-memory location of the assoc. screenshot. */
    screenshot?: string
    /** Object URL to the in-memory location of the assoc. fav-icon. */
    favIcon?: string
    annotations: Annotation[]
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

export type AnnotationSender = (
    { annotation, tabId }: { annotation: Annotation; tabId: number },
) => void
