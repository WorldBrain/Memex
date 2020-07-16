export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    areListsShared(options: {
        listIds: number[]
    }): Promise<{ [listId: number]: boolean }>
}
