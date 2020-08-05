export * from '@worldbrain/memex-common/lib/content-sharing/client-storage/types'

export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
    shareAnnotation(options: { annotationUrl: string }): Promise<void>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForSync(): Promise<void>
}
