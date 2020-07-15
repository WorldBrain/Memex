export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
    areListsShared(options: {
        listIds: number[]
    }): Promise<{ [listId: number]: boolean }>
}
