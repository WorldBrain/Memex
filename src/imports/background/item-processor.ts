import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import { normalizeTimestamp } from './utils'
import TagsBackground from 'src/tags/background'
import CustomListBackground from 'src/custom-lists/background'
import { PageIndexingBackground } from 'src/page-indexing/background'
import BookmarksBackground from 'src/bookmarks/background'

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

    async _storeOtherData({ url, tags = [], collections, annotations }) {
        this._checkCancelled()
        try {
            const listIds = await this.options.customListsModule.createCustomLists(
                {
                    names: collections,
                },
            )
            await Promise.all([
                ...listIds.map(async (listId) => {
                    await this.options.customListsModule.insertPageToList({
                        id: listId,
                        url,
                        suppressVisitCreation: true,
                    })
                }),
                ...tags.map(async (tag) => {
                    await this.options.tagsModule
                        .addTagToExistingUrl({
                            url,
                            tag,
                        })
                        .catch((e) => {}) // Lots of outside tags may violate our tag validity pattern; catch them and try others
                }),
            ])
        } catch (e) {
            console.error(e, url)
        }
    }

    /**
     * Handles processing of a bookmark import item. Checks for exisitng page docs that have the same URL.
     *
     * @param {IImportItem} importItemDoc
     * @returns {any} Status string denoting the outcome of import processing as `status`
     *  + optional filled-out page doc as `pageDoc` field.
     */
    async _processBookmark(importItem, options: { indexTitle?: any } = {}) {
        const { url, title, tags, collections, annotations } = importItem

        const timeAdded = normalizeTimestamp(importItem.timeAdded)

        await this.options.pages.indexPage({
            fullUrl: importItem.url,
            skipUpdatePageCount: true,
        })

        await this.options.bookmarks.storage.createBookmarkIfNeeded(
            importItem.url,
            timeAdded ?? Date.now(),
        )

        await this._storeOtherData({ url, tags, collections, annotations })

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    async _processBookmarkWithTags(
        importItem,
        options: { indexTitle?: any } = {},
    ) {
        const status = this._processBookmark(importItem, options)
        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])

        await setLocalStorage(TAG_SUGGESTIONS_KEY, [
            ...new Set([...tagSuggestions, ...importItem.tags]),
        ])

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return status
    }

    async _processService(importItem, options: { indexTitle?: any } = {}) {
        const { url, title, tags, collections, annotations } = importItem

        const timeAdded = normalizeTimestamp(importItem.timeAdded)

        await this.options.pages.indexPage({ fullUrl: importItem.url })

        await this.options.bookmarks.storage.createBookmarkIfNeeded(
            importItem.url,
            timeAdded ?? Date.now(),
        )

        await this._storeOtherData({ url, tags, collections, annotations })

        const tagSuggestions = await getLocalStorage(TAG_SUGGESTIONS_KEY, [])

        await setLocalStorage(TAG_SUGGESTIONS_KEY, [
            ...new Set([...tagSuggestions, ...tags]),
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
    async process(importItem, options = {}) {
        this._checkCancelled()

        switch (importItem.type) {
            case IMPORT_TYPE.BOOKMARK:
                return this._processBookmark(importItem, options)
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
