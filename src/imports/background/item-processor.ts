import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import { normalizeTimestamp } from './utils'
import TagsBackground from 'src/tags/background'
import CustomListBackground from 'src/custom-lists/background'
import { PageIndexingBackground } from 'src/page-indexing/background'
import BookmarksBackground from 'src/bookmarks/background'
import checkBrowser from 'src/util/check-browser'
import browser from 'webextension-polyfill'

type BookmarkNode = {
    id: string
    parentId: string
    title: string
    url?: string // Make url optional since folders won't have URLs
    localListId?: number // Optional property for custom list ID
    children?: BookmarkNode[] // Optional property for child nodes
}

/**
 * TransitionType strings that we care about in the context of the ext.
 */
const wantedTransitionTypes = new Set([
    'link',
    'generated',
    'keyword',
    'keyword_generated',
    'typed',
    'auto_bookmark',
    'manual_subframe',
    'reload',
    'auto_toplevel',
])

export default class ImportItemProcessor {
    /**
     * @type {boolean} Flag denoting whether or not execution has been cancelled.
     */
    cancelled = false

    /**
     * @type {boolean} Flag denoting whether or not execution has finished successfully or not.
     */
    finished = false

    static makeInterruptedErr() {
        const err = new Error('Execution interrupted')
        err['cancelled'] = true
        return err
    }

    constructor(
        private options: {
            tagsModule: TagsBackground
            pages: PageIndexingBackground
            bookmarks: BookmarksBackground
            customListsModule: CustomListBackground
        },
    ) {}

    /**
     * Hacky way of enabling cancellation. Checks state and throws an Error if detected change.
     * Should be called by any main execution methods before any expensive async logic run.
     *
     * TODO: May move this to token-based later - need to come up with a clean way.
     *
     * @throws {Error} If `this.cancelled` is set.
     */
    _checkCancelled() {
        if (this.cancelled) {
            throw ImportItemProcessor.makeInterruptedErr()
        }
    }

    async _storeDocs({
        pageDoc,
        bookmark,
        visits = [],
        rejectNoContent = true,
    }) {
        this._checkCancelled()

        await this.options.pages.addPage({
            pageDoc,
            visits,
            rejectNoContent,
        })
    }

    /*
    how to do it: 
    Every item processed has a parentId and the collectionName as such. I need a representation of the entire tree with values for
    - item processed bookmark id, item processed space Id, so that every new item processed can be added to the right space
    Once an folder is processed first time and in that bookmarktree list, it will not be recreated again, however the first time it will. 
    - when creating, check against their saved parentID to make it a subspace of that
*/

    async _storeOtherData({ url, spaceId }) {
        this._checkCancelled()
        if (spaceId != null && url != null) {
            try {
                // Check if the parentId exists in this.spaceTree to find the corresponding spaceId
                if (!spaceId) {
                    console.error(`No spaceId found for parentId: ${spaceId}`)
                    return
                }

                await this.options.customListsModule.insertPageToList({
                    id: spaceId,
                    url: url,
                    suppressVisitCreation: true,
                    skipPageIndexing: true,
                })
            } catch (e) {
                console.error(e, url)
            }
        }
    }
    /**
     * Handles processing of a bookmark import item. Checks for exisitng page docs that have the same URL.
     *
     * @param {IImportItem} importItemDoc
     * @returns {any} Status string denoting the outcome of import processing as `status`
     *  + optional filled-out page doc as `pageDoc` field.
     */
    async _processBookmark(
        importItem,
        spaceTreeMap,
        options: { indexTitle?: any } = {},
    ) {
        const { url, title, parentId } = importItem

        const timeAdded = normalizeTimestamp(importItem.timeAdded)

        await this.options.pages.indexPage({
            fullUrl: importItem.url,
            skipUpdatePageCount: true,
            metaData: { pageTitle: title },
        })

        await this.options.bookmarks.storage.createBookmarkIfNeeded(
            importItem.url,
            timeAdded ?? Date.now(),
        )

        const spaceId = spaceTreeMap[parentId]
        await this._storeOtherData({ url: importItem.url, spaceId: spaceId })

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    async _processBookmarkWithTags(
        importItem,
        spaceTreeMap,
        options: { indexTitle?: any } = {},
    ) {
        const status = this._processBookmark(importItem, spaceTreeMap, options)
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])

        await setLocalStorage(TAG_SUGGESTIONS_KEY, [
            ...new Set([...tagSuggestions, ...importItem.tags]),
        ])

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return status
    }

    async _processService(importItem, options: { indexTitle?: any } = {}) {
        const { url, title, spaceId } = importItem

        const timeAdded = normalizeTimestamp(importItem.timeAdded)

        await this.options.pages.indexPage({ fullUrl: importItem.url })

        await this.options.bookmarks.storage.createBookmarkIfNeeded(
            importItem.url,
            timeAdded ?? Date.now(),
        )

        await this._storeOtherData({ url, spaceId })

        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])

        await setLocalStorage(TAG_SUGGESTIONS_KEY, [
            ...new Set([...tagSuggestions]),
        ])

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    /**
     * Given an import state item, performs appropriate processing depending on the import type.
     * Main execution method.
     *
     * @param {IImportItem} importItem Import item state item to process.
     * @returns {Promise<any>} Resolves to a status string denoting the outcome of import processing as `status`.
     *  Rejects for any other error, including bad content check errors, and cancellation - caller should handle.
     */
    async process(importItem, spaceTreeMap, options = {}) {
        this._checkCancelled()

        switch (importItem.type) {
            case IMPORT_TYPE.BOOKMARK:
                return this._processBookmark(importItem, spaceTreeMap, options)
            case IMPORT_TYPE.OTHERS:
                return this._processService(importItem, options)
            default:
                throw new Error('Unknown import type')
        }
    }

    /**
     * Aborts execution. Note that once called, exeuction will only actually stop when the main
     * methods reach a `this._checkCancelled()` call.
     */
    cancel() {
        this.cancelled = true
    }
}
