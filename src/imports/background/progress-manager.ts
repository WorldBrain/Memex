import promiseLimit from 'promise-limit'
import noop from 'lodash/fp/noop'

import ItemProcessor from './item-processor'
import TagsBackground from 'src/tags/background'
import CustomListBackground from 'src/custom-lists/background'
import { PageIndexingBackground } from 'src/page-indexing/background'
import BookmarksBackground from 'src/bookmarks/background'
import browser from 'webextension-polyfill'
import checkBrowser from 'src/util/check-browser'
import { IMPORT_TYPE } from 'src/options/imports/constants'

interface ImportItem {
    type: string
    // Add other properties of ImportItem as needed
}

export default class ImportProgressManager {
    static CONCURR_LIMIT = 20
    static DEF_CONCURR = 1
    static DEF_OBSERVER = { next: noop, complete: noop }

    /**
     * @type {ItemProcessor[]} Currently scheduled processor instances, affording control over execution.
     */
    processors: ItemProcessor[] = []

    /**
     * @type {number} Currently set level of concurrency.
     */
    _concurrency

    /**
     * @type {any} Object containing `next` and `complete` methods to run after each item and when
     *  all items complete, respecitively.
     */
    _observer

    /**
     * @type {boolean} Flag denoting whether or not current state is stopped or not.
     */
    stopped = true

    _Processor: typeof ItemProcessor
    runConcurrent

    constructor(
        private options: {
            pages: PageIndexingBackground
            tagsModule: TagsBackground
            customListsModule: CustomListBackground
            bookmarks: BookmarksBackground
            concurrency?: any
            observer?: any
            stateManager: any
            Processor?: typeof ItemProcessor
        },
    ) {
        this.concurrency =
            options.concurrency ?? ImportProgressManager.DEF_CONCURR
        this._observer = options.observer ?? ImportProgressManager.DEF_OBSERVER
        this._Processor = options.Processor ?? ItemProcessor
    }

    set concurrency(value) {
        if (value > 0 && value <= ImportProgressManager.CONCURR_LIMIT) {
            this._concurrency = value
            // Update Promise concurrency affording functionality
            this.runConcurrent = promiseLimit(value)
        }
    }

    /**
     * Get next available processor index.
     *
     * @returns {number} Index between 0 and `this._concurrency`.
     */
    _nextProcIndex() {
        for (let i = 0; i < this._concurrency; i++) {
            const proc = this.processors[i]

            // Take current spot if empty or saved processor is in finished state
            if (proc == null || proc.finished) {
                return i
            }
        }

        return 0 // Base case; should not be reached
    }

    /**
     * @param {[key: string, value: ImportItem]} entry Any KVP entry from a chunk.
     * @returns {boolean} Flag denoting whether or not chunk where `entry` came from is allowed by type.
     */
    _checkChunkTypeAllowed([key, item]) {
        return !!this.options.stateManager.allowTypes[item.type]
    }

    /**
     * @param {string} chunkKey The key of the chunk currently being processed.
     * @returns {(chunkEntry) => Promise<void>} Async function affording processing of single entry in chunk.
     */
    _processItem = (chunkKey, spaceTreeMap?) => async ([
        encodedUrl,
        importItem,
    ]) => {
        const processor = new this._Processor({
            tagsModule: this.options.tagsModule,
            customListsModule: this.options.customListsModule,
            pages: this.options.pages,
            bookmarks: this.options.bookmarks,
        })

        // Used to build the message to send to observer
        const msg: { type: any; url: any; status?: any; error?: any } = {
            type: importItem.type,
            url: importItem.url,
        }

        try {
            if (this.stopped) {
                throw this._Processor.makeInterruptedErr()
            }

            // Save reference to processor for cancelling later
            this.processors[this._nextProcIndex()] = processor
            const res = await processor.process(
                importItem,
                spaceTreeMap,
                this.options.stateManager.options,
            )
            msg.status = res.status
        } catch (err) {
            // Throw execution was cancelled, throw error up the stack
            if (err.cancelled) {
                throw err
            }
            msg.error = err.message
        } finally {
            processor.finished = true

            // Send item data + outcome status down to UI (and error if present)
            if (!this.stopped) {
                this._observer.next(msg)

                // Either flag as error or remove from state depending on processing error status
                if (msg.error) {
                    await this.options.stateManager.flagItemAsError(
                        chunkKey,
                        encodedUrl,
                    )
                } else {
                    await this.options.stateManager.removeItem(
                        chunkKey,
                        encodedUrl,
                    )
                }
            }
        }
    }

    /**
     * Start execution
     */
    async start() {
        this.stopped = false

        // Iterate through data chunks from the state manager
        for await (const {
            chunk,
            chunkKey,
        } of this.options.stateManager.fetchItems()) {
            const importItemEntries = Object.entries(chunk)

            // Skip early if first entry type is not allowed (entire chunk's of same type items)
            if (
                !importItemEntries.length ||
                !this._checkChunkTypeAllowed(importItemEntries[0])
            ) {
                continue
            }
            const importType = (importItemEntries[0][1] as ImportItem).type
            let spaceTreeMap = null
            if (importType === IMPORT_TYPE.BOOKMARK) {
                // Create custom lists for bookmark folders

                let localListId = null
                let map = []
                const existing = await this.options.customListsModule.fetchListByName(
                    {
                        name: 'Browser Bookmarks',
                    },
                )
                if (existing == null) {
                    const BrowserBookmarksSpace = await this.options.customListsModule.createCustomList(
                        {
                            name: 'Browser Bookmarks',
                        },
                    )
                    map[-1] = BrowserBookmarksSpace.localListId
                    localListId = BrowserBookmarksSpace.localListId
                } else {
                    map[-1] = existing.id
                    localListId = existing.id
                }

                spaceTreeMap = await this.createSpaceTreeForBookmarkFolder(
                    null,
                    localListId,
                    map,
                )
            }

            try {
                // For each chunk, run through the import item entries at specified level of concurrency
                await this.runConcurrent.map(
                    importItemEntries,
                    this._processItem(chunkKey, spaceTreeMap),
                )
            } catch (err) {
                // If execution cancelled break Iterator processing
                if (err.cancelled) {
                    break
                }
                console.error(err)
            }
        }

        if (!this.stopped) {
            // Notify observer that we're done!
            this._observer.complete()
        }
    }

    /**
     * Goes through each processor and runs the `cancel` method.
     * Processor state is cleared afterwards.
     */
    stop() {
        this.stopped = true

        // Run processors' cancal methods to stop running async logic, then wipe references
        this.processors.forEach((proc) => proc != null && proc.cancel())
        this.processors = []
    }

    get ROOT_BM() {
        return {
            id: checkBrowser() === 'firefox' ? '' : '0',
        }
    }
    async createSpaceTreeForBookmarkFolder(
        dirNode = null,
        parentSpaceId = null,
        map, // Change to use an object for direct mapping
    ) {
        if (!dirNode) {
            dirNode = this.ROOT_BM
        }

        const children = await browser.bookmarks.getChildren(dirNode.id)
        // Process each child node
        for (const child of children) {
            const { id, parentId, title, url } = child

            // If the current node is a folder (no URL), create a custom list
            if (!url) {
                // Create custom list for the folder

                const existingList = await this.options.customListsModule.fetchListByName(
                    {
                        name: title,
                    },
                )

                if (existingList) {
                    const existingListTree = await this.options.customListsModule.fetchListTreeById(
                        { id: existingList.id },
                    )

                    // check if the existing list is in the subfolders of the browser bookmarks
                    const existingPath = existingListTree.pathListIds
                    if (existingPath.includes(map[-1])) {
                        map[parentId] = existingList.id
                        return
                    }
                }

                const {
                    localListId,
                } = await this.options.customListsModule.createCustomList({
                    name: title,
                    parentListId: parentSpaceId,
                })

                // Map the parentId to the spaceId
                map[id] = localListId

                // Recurse to process children, passing the current localId as the parentSpaceId for the next level
                await this.createSpaceTreeForBookmarkFolder(
                    child,
                    localListId,
                    map,
                )
            }
        }

        // Only return the map at the top level call to avoid returning intermediate results

        return map
    }
}
