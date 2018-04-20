import moment from 'moment'

export default class ImportDataSources {
    static LOOKBACK_WEEKS = 12 // Browser history is limited to the last 3 months

    static DEF_HIST_PARAMS = {
        text: '',
        maxResults: 999999,
    }

    /**
     * Bookmarks are stored in a shallow tree, which we traverse recursively. We need a node to start from.
     *  Chrome and FF seem to ID their bookmark data differently. Root works from '' in FF
     *  but needs '0' in Chrome. `runtime.getBrowserInfo` is only available on FF web ext API
     */
    static ROOT_BM = {
        id: typeof browser.runtime.getBrowserInfo === 'undefined' ? '0' : '',
    }

    constructor({ history = browser.history, bookmarks = browser.bookmarks }) {
        this._history = history
        this._bookmarks = bookmarks
    }

    _createHistParams = time => ({
        ...ImportDataSources.DEF_HIST_PARAMS,
        endTime: time,
        startTime: moment(time)
            .subtract(1, 'week')
            .valueOf(),
    })

    /**
     * @return {AsyncIterable<BrowserItem[]>} History items in current period.
     */
    async *history() {
        // Get all history from browser (last 3 months), filter on existing DB pages
        const baseTime = moment()
            .startOf('day')
            .subtract(ImportDataSources.LOOKBACK_WEEKS, 'weeks')

        // Fetch and filter history in week batches to limit space
        for (
            let time = moment();
            time.isSameOrAfter(baseTime);
            time.subtract(1, 'week')
        ) {
            yield this._history.search(this._createHistParams(time.valueOf()))
        }
    }

    /**
     * Recursively traverses BFS-like from the specified node in the BookmarkTree,
     * yielding the transformed bookmark ImportItems at each dir level.
     *
     * @param {browser.BookmarkTreeNode} [dirNode] BM node representing a bookmark directory.
     * @return {AsyncIterable<BrowserItem[]>} Bookmark items in current level.
     */
    async *bookmarks(dirNode = ImportDataSources.ROOT_BM) {
        // Folders don't contain `url`; recurse!
        const children = await this._bookmarks.getChildren(dirNode.id)

        // Split into folders and bookmarks
        const childGroups = children.reduce(
            (prev, childNode) => {
                const stateKey = !childNode.url ? 'dirs' : 'bms'

                return {
                    ...prev,
                    [stateKey]: [...prev[stateKey], childNode],
                }
            },
            { dirs: [], bms: [] },
        )

        yield childGroups.bms

        // Recursively process next levels (not expected to get deep)
        for (const dirNode of childGroups.dirs) {
            yield* this.bookmarks(dirNode)
        }
    }
}
