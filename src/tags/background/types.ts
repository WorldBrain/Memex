export interface RemoteTagsInterface {
    addTag(args: { tag: string; url: string }): Promise<void>
    delTag(args: { tag: string; url: string }): Promise<void>

    addPageTag(args: { tag: string; url: string }): Promise<void>
    delPageTag(args: { tag: string; url: string }): Promise<void>
    fetchPageTags(url: string): Promise<string[]>

    addTagsToOpenTabs(args: {
        tag: string
        tabs?: TagTab[]
        time?: number
    }): Promise<void>
    delTagsFromOpenTabs(args: { name: string; tabs?: TagTab[] }): Promise<void>
}

export interface TagTab {
    tabId: number
    url: string
}
