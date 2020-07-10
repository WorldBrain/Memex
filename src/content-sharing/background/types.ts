export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<{ serverListId: string }>
    shareListEntries(options: { listId: number }): Promise<void>
}
