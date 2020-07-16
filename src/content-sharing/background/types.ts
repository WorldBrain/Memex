export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ remoteListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
    getRemoteListId(options: { localListId: number }): Promise<string | null>
    areListsShared(options: {
        localListIds: number[]
    }): Promise<{ [listId: number]: boolean }>
    waitForListSync(options: { localListId: number }): Promise<void>
}

export type ContentSharingAction = AddSharedListEntryAction
export interface AddSharedListEntryAction {
    type: 'add-shared-list-entry'
    localListId: number
    remoteListId: string
    data: {
        entryTitle: string
        originalUrl: string
        normalizedUrl: string
    }
}
