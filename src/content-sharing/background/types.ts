export interface ContentSharingInterface {
    shareList(options: { listId: number }): Promise<void>
    shareListEntries(options: { listId: number }): Promise<void>
}
