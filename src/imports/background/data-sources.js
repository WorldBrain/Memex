import moment from 'moment'
import browserIsChrome from '../../util/check-browser'
import {
    IMPORT_TYPE as TYPE,
    IMPORT_SERVICES as SERVICES,
} from 'src/options/imports/constants'
import { loadBlob } from 'src/imports/background/utils'
import { parsePocket, parseNetscape } from './service-parsers'

export default class ImportDataSources {
    static LOOKBACK_WEEKS = 12 // Browser history is limited to the last 3 months

    static DEF_HIST_PARAMS = {
        text: '',
        maxResults: 999999,
    }

    /**
     * Bookmarks are stored in a shallow tree, which we traverse recursively. We need a node to start from.
     *  Chrome and FF seem to ID their bookmark data differently. Root works from '' in FF
     *  but needs '0' in Chrome.
     */
    get ROOT_BM() {
        return {
            id: browserIsChrome() ? '0' : '',
        }
    }

    constructor({
        history = typeof browser !== 'undefined' ? browser.history : undefined,
        bookmarks = typeof browser !== 'undefined'
            ? browser.bookmarks
            : undefined,
    }) {
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
    async *bookmarks(dirNode = null) {
        if (!dirNode) {
            dirNode = this.ROOT_BM
        }

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
        for (const dir of childGroups.dirs) {
            yield* this.bookmarks(dir)
        }
    }

    /**
     * Parses file contents and returns import items
     * @param {string} url Blob URL
     * @param {object} allowTypes
     * @return {Item[]} Parsed Items
     */
    async parseFile(url, allowTypes) {
        let contents
        let items = []

        if (!allowTypes || !url) {
            return items
        }

        if (
            allowTypes[TYPE.OTHERS] === SERVICES.POCKET ||
            allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE
        ) {
            contents = await loadBlob({
                url,
                timeout: 10000,
                responseType: 'document',
            })
        }

        if (allowTypes[TYPE.OTHERS] === SERVICES.POCKET) {
            items = parsePocket(contents)
        } else if (allowTypes[TYPE.OTHERS] === SERVICES.NETSCAPE) {
            items = parseNetscape(contents)
        }

        return items
    }
}
