import { LocalFolder } from 'src/sidebar/annotations-sidebar/containers/types'

export interface PkmSyncInterface {
    addFeedSources(
        feedSources: {
            feedUrl: string
            feedTitle: string
            type?: 'substack' | string
            feedFavIcon?: string
        }[],
    ): Promise<void>
    checkFeedSource(
        feedUrl,
    ): Promise<{
        feedUrl: string
        feedTitle: string
        feedFavIcon?: string
    }>
    removeFeedSource(feedUrl: string): Promise<void>
    checkConnectionStatus(): Promise<boolean | 'not-available'>
    loadFeedSources(): Promise<
        { feedUrl: string; feedTitle: string; type: 'substack' }[]
    >
    openLocalFile(path: string): Promise<void>
    addLocalFolder(): Promise<LocalFolder>
    getLocalFolders(): Promise<LocalFolder[]>
    removeLocalFolder(id: number): Promise<void>
    getSystemArchAndOS(): Promise<{ arch: string; os: string }>
}
