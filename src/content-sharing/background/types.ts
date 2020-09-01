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
    }): Promise<void>
    shareAnnotationsToLists(options: {
        annotationUrls: string[]
    }): Promise<void>
    unshareAnnotationsFromLists(options: {
        annotationUrl: string[]
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
    | 'queue-and-await-execution'
    | 'queue-and-return'
    | 'skip-queue'
