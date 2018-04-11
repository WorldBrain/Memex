import whenAllSettled from 'when-all-settled'

import exportOldPages, { ExportParams } from '../search-index-old/export'
import importNewPage from '../search-index-new/import'

class MigrationManager {
    static DEF_PARAMS: ExportParams = {
        chunkSize: 10,
        startKey: 'page/',
        endKey: 'page/\uffff',
    }

    /**
     * Acts as a flag to stop iteration over old pages if ever set.
     */
    private isCancelled = false

    /**
     * Acts as a progress state, holding the page key to start iterating from.
     */
    private currKey = MigrationManager.DEF_PARAMS.startKey

    private concurrency: number

    constructor(initConcurrency = MigrationManager.DEF_PARAMS.chunkSize) {
        this.concurrency = initConcurrency
    }

    private async migrate(opts: Partial<ExportParams>) {
        const exportParams = { ...MigrationManager.DEF_PARAMS, ...opts }

        for await (const { pages, lastKey } of exportOldPages(exportParams)) {
            this.currKey = lastKey

            // If `stop()` method has been called, break out of this loop (one chance per iteration)
            if (this.isCancelled) {
                this.isCancelled = false
                break
            }

            await whenAllSettled(pages.map(importNewPage))
        }
    }

    /**
     * Starts migration from last recorded progress state.
     *
     * @returns A long running Promise that will resolve once migration is finished, or interrupted.
     */
    public start(concurrency = this.concurrency) {
        return this.migrate({ chunkSize: concurrency, startKey: this.currKey })
    }

    /**
     * Schedules for the migration iterations to stop when next check happens (once per iteration).
     */
    public stop() {
        this.isCancelled = true
    }
}

export default MigrationManager
