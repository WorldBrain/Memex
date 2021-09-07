import Dexie from 'dexie'
import { exportDB, ExportOptions } from 'dexie-export-import'
import { fileSave } from 'browser-fs-access'

export interface Dependencies {
    dbName?: string
    progressCallback: ExportOptions['progressCallback']
}

/**
 * NOTE: This function should NOT be run from the background script. The download prompt will not work in Firefox unless it's run from the options script.
 */
export async function dumpDB({
    dbName = 'memex',
    progressCallback,
}: Dependencies): Promise<void> {
    const db = await new Dexie(dbName).open()

    const dbContentsBlob = await exportDB(db, {
        noTransaction: true,
        progressCallback,
    })

    await fileSave(dbContentsBlob, {
        startIn: 'downloads',
        extensions: ['.txt', '.json'],
        fileName: 'memex-db-dump.json',
    })
}
