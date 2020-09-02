export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'

export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: {
        listId: number
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    shareAnnotation(options: {
        annotationUrl: string
        queueInteraction?: ContentSharingQueueInteraction
        withoutPageInfo?: boolean
    }): Promise<void>
    shareAnnotationsToLists(options: {
        normalizedPageUrl: string
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotationsFromLists(options: {
        normalizedPageUrl: string
        annotationUrls: string[]
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    unshareAnnotation(options: {
        annotationUrl: string
        queueInteraction?: ContentSharingQueueInteraction
    }): Promise<void>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    getRemoteAnnotationIds(params: {
        annotationUrls: string[]
    }): Promise<{ [localId: string]: string | number }>
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForSync(): Promise<void>
}

export interface ContentSharingEvents {
    pageAddedToSharedList(options: { pageUrl: string }): void
    pageRemovedFromSharedList(options: { pageUrl: string }): void
}

export type ContentSharingQueueInteraction =
    | 'queue-and-await'
    | 'queue-and-return'
    | 'skip-queue'
