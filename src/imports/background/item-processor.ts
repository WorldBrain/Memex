import { browser } from 'webextension-polyfill-ts'
import fetchPageData from 'src/page-analysis/background/fetch-page-data'
import { IMPORT_TYPE, DOWNLOAD_STATUS } from 'src/options/imports/constants'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'
import { TAG_SUGGESTIONS_KEY } from 'src/constants'
import { padShortTimestamp } from './utils'
import { SearchIndex } from 'src/search'
import TagsBackground from 'src/tags/background'
import CustomListBackground from 'src/custom-lists/background'

const fetchPageDataOpts = {
    includePageContent: true,
    includeFavIcon: true,
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

/**
 * @param {history.VisitItem} item VisitItem object received from the WebExt History API.
 * @returns {boolean}
 */
const filterVisitItemByTransType = item =>
    wantedTransitionTypes.has(item.transition)

/**
 * @param {IImportItem} importItem
 * @throws {Error} Allows short-circuiting of the import process for current item if no VisitItems left after
 *  filtering.
 */
async function checkVisitItemTransitionTypes({ url }) {
    const visitItems = await browser.history.getVisits({ url })

    // Only keep VisitItems with wanted TransitionType
    const filteredVisitItems = visitItems.filter(filterVisitItemByTransType)

    // Throw if no VisitItems left post-filtering (only if there was items to begin with)
    if (visitItems.length > 0 && filteredVisitItems.length === 0) {
        throw new Error('Unused TransitionType')
    }
}

const getVisitTimes = ({ url }) =>
    browser.history
        .getVisits({ url })
        .then(visits => visits.map(visit => Math.trunc(visit.visitTime)))

async function getBookmarkTime({ browserId }) {
    // Web Ext. API should return array of BookmarkItems; grab first one
    const [bookmarkItem] = await browser.bookmarks.get(browserId)

    if (bookmarkItem) {
        return bookmarkItem.dateAdded || undefined
    }

    return undefined
}

export default class ImportItemProcessor {
    /**
     * @type {Function} Function to afford aborting current XHR. Set when import processor reaches XHR point.
     */
    abortXHR

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
            searchIndex: SearchIndex
            tagsModule: TagsBackground
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

        return this.options.searchIndex.addPage({
            pageDoc,
            visits,
            bookmark,
            rejectNoContent,
        })
    }

    async _storeOtherData({ url, tags, collections, annotations }) {
        this._checkCancelled()
        try {
            const listIds = await this.options.customListsModule.createCustomLists(
                {
                    names: collections,
                },
            )
            await Promise.all([
                ...listIds.map(async listId => {
                    await this.options.customListsModule.insertPageToList({
                        id: listId,
                        url,
                    })
                }),
                ...tags.map(async tag => {
                    await this.options.tagsModule.addTagToExistingUrl({
                        url,
                        tag,
                    })
                }),
            ])
        } catch (e) {
            console.error(e, url)
        }
    }

    /**
     * Using the `url` of the current item, performs the XHR and formatting needed on the response
     * to form a new page doc.
     *
     * @param {IImportItem} importItem
     * @returns {PageDoc}
     */
    async _createPageDoc({ url }) {
        const includeFavIcon = !(await this.options.searchIndex.domainHasFavIcon(
            url,
        ))

        // Do the page data fetch
        const fetch = fetchPageData({
            url,
            opts: {
                ...fetchPageDataOpts,
                includeFavIcon,
            },
        })

        this.abortXHR = fetch.cancel

        this._checkCancelled()
        const pageContent = await fetch.run()

        return { url, ...pageContent }
    }

    /**
     * Handles processing of a history-type import item. Checks for exisitng page docs that have the same URL.
     *
     * @param {IImportItem} importItemDoc
     * @returns {any} Status string denoting the outcome of import processing as `status`
     *  + optional filled-out page doc as `pageDoc` field.
     */
    async _processHistory(importItem, options: { indexTitle?: any } = {}) {
        if (!options.indexTitle) {
            await checkVisitItemTransitionTypes(importItem)
        }

        const pageDoc = !options.indexTitle
            ? await this._createPageDoc(importItem)
            : {
                  url: importItem.url,
                  content: {
                      title: importItem.title,
                  },
              }

        const visits = await getVisitTimes(importItem)

        let bookmark
        if (importItem.type === IMPORT_TYPE.BOOKMARK) {
            bookmark = await getBookmarkTime(importItem)
        }

        await this._storeDocs({
            pageDoc,
            visits,
            bookmark,
            rejectNoContent: false,
        })

        this._checkCancelled()
        // If we finally got here without an error being thrown, return the success status message + pageDoc data
        return { status: DOWNLOAD_STATUS.SUCC }
    }

    async _processService(
        importItem,
        options: { indexTitle?: any; bookmarkImports?: any } = {},
    ) {
        const { url, title, tags, collections, annotations } = importItem

        const timeAdded = padShortTimestamp(importItem.timeAdded)

        const pageDoc = !options.indexTitle
            ? await this._createPageDoc({ url })
            : {
                  url,
                  content: {
                      title,
                  },
              }

        const visits = await getVisitTimes({ url })

        if (timeAdded) {
            visits.push(timeAdded)
        }

        const bookmark = options.bookmarkImports
            ? timeAdded || Date.now()
            : undefined

        await this._storeDocs({
            pageDoc,
            bookmark,
            visits,
            rejectNoContent: false,
        })
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
            case IMPORT_TYPE.HISTORY:
                return this._processHistory(importItem, options)
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
        if (typeof this.abortXHR === 'function') {
            this.abortXHR()
        }
        this.cancelled = true
    }
}
