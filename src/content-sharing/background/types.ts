export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ serverListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
    areListsShared(options: {
        listIds: number[]
    }): Promise<{ [listId: number]: boolean }>
}
