import { browser } from 'webextension-polyfill-ts'
import whenAllSettled from 'when-all-settled'

import exportOldPages, { ExportParams } from '../search-index-old/export'
import importNewPage from '../search-index-new/import'
import analytics from '../../analytics'
import createNotif from '../../util/notifications'
import { MIGRATE_NOTIF, INFO_LINK } from './constants'

export interface Props {
    concurrency: number
    onComplete: () => void
}

class MigrationInterrupt extends Error {}

export class MigrationManager {
    public static PROGRESS_STORAGE_KEY = 'migration-progress'
    public static NOTIF_STORAGE_KEY = 'migration-notif-shown'
    public static FINISHED_STATE = ''
    public static DEF_PARAMS: ExportParams = {
        chunkSize: 10,
        startKey: 'page/',
        endKey: 'page/\uffff',
    }

    private static persistProgressState = (
        key = MigrationManager.FINISHED_STATE,
    ) =>
        browser.storage.local.set({
            [MigrationManager.PROGRESS_STORAGE_KEY]: key,
        })

    /**
     * Acts as a flag to stop iteration over old pages if ever set.
     */
    private isCancelled = false

    /**
     * Acts as a progress state, holding the page key to start iterating from.
     */
    private currKey: string

    private concurrency: number
    private onComplete: () => void

    public static async showNotif() {
        return createNotif(MIGRATE_NOTIF, () =>
            browser.tabs.create({ url: INFO_LINK }),
        )
    }

    constructor({
        concurrency = MigrationManager.DEF_PARAMS.chunkSize,
        onComplete = () => false,
    }: Partial<Props>) {
        this.concurrency = concurrency
        this.onComplete = onComplete

        this.rehydrateProgressState() // tslint:disable-line
    }

    public get isFinished() {
        return this.currKey === MigrationManager.FINISHED_STATE
    }

    /**
     * Attempts to rehydrate previously persisted progress state, or sets default.
     */
    private async rehydrateProgressState() {
        try {
            const {
                [MigrationManager.PROGRESS_STORAGE_KEY]: storedKey,
            } = await browser.storage.local.get({
                [MigrationManager.PROGRESS_STORAGE_KEY]:
                    MigrationManager.DEF_PARAMS.startKey,
            })

            this.currKey = storedKey
        } catch (err) {
            this.currKey = MigrationManager.DEF_PARAMS.startKey
        }
    }

    /**
     * Always throws an Error to signify interruption to caller.
     * Saves local and persisted progress states.
     */
    private async handleInterruption() {
        this.isCancelled = false
        throw new MigrationInterrupt()
    }

    private async handleComplete() {
        this.currKey = MigrationManager.FINISHED_STATE
        await MigrationManager.persistProgressState()

        this.onComplete() // Delegate control to outside listener
    }

    /**
     * Will reject if `stop()` method has been called. Will resolve when old
     * page data is exhausted.
     */
    private async migrate(opts: Partial<ExportParams>) {
        const exportParams = { ...MigrationManager.DEF_PARAMS, ...opts }

        for await (const { pages, lastKey } of exportOldPages(exportParams)) {
            this.currKey = lastKey
            await MigrationManager.persistProgressState(this.currKey)

            if (this.isCancelled) {
                await this.handleInterruption()
            }

            await whenAllSettled(pages.map(importNewPage))
        }
    }

    /**
     * Starts migration from last recorded progress state.
     *
     * @returns A long running Promise that will resolve once migration is finished, or interrupted.
     */
    public async start(concurrency = this.concurrency) {
        if (this.isFinished) {
            return
        }

        try {
            await this.migrate({
                chunkSize: concurrency,
                startKey: this.currKey,
            })

            await this.handleComplete()
        } catch (err) {
            if (err instanceof MigrationInterrupt) {
                // Error only used to signal interruption
                return
            }

            await analytics.trackEvent({
                category: 'Migration',
                action: 'Error',
                name: err.toString(),
            })

            throw err
        }
    }

    /**
     * Schedules for the migration iterations to stop when next check happens (once per iteration).
     */
    public async stop() {
        this.isCancelled = true

        const {
            [MigrationManager.NOTIF_STORAGE_KEY]: notifAlreadyShown,
        } = await browser.storage.local.get(MigrationManager.NOTIF_STORAGE_KEY)

        if (!notifAlreadyShown && this.isFinished) {
            await MigrationManager.showNotif()

            // Set the flag so this condition should never pass again
            await browser.storage.local.set({
                [MigrationManager.NOTIF_STORAGE_KEY]: true,
            })
        }
    }
}
