export interface BookmarksInterface {
    addBookmark({ url }: { url: string }): Promise<any>
    delBookmark({ url }: { url: string }): Promise<any>
}
