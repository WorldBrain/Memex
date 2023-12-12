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
    checkConnectionStatus(): Promise<boolean | 'not-available'>
    loadFeedSources(): Promise<
        { feedUrl: string; feedTitle: string; type: 'substack' }[]
    >
}
