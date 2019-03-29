import Dexie from 'dexie'
import Storex from '@worldbrain/storex'

import { DBGet } from './types'

/*
 * Bit of a hack to allow the storex Dexie backend to be available to all
 * the legacy code that uses Dexie directly (i.e., all this module's exports).
 * Storex is init'd async, hence this needs to be a Promise that resolves to
 * the backend. It is resolved after storex is init'd in the BG script entrypoint.
 */
let db: Promise<Storex>
let resolveDb: (db: Storex) => void = null
const createNewDbPromise = () => {
    db = new Promise<Storex>(resolve => (resolveDb = resolve))
}
createNewDbPromise()

export const setStorex = (storex: Storex) => {
    if (!resolveDb) {
        createNewDbPromise()
    }

    overrideDexieOps(storex.backend['dexieInstance'])

    // Extend the base Dexie instance with all the Memex-specific stuff we've added
    resolveDb(storex)

    resolveDb = null
}

/**
 * Overrides `Dexie._createTransaction` to ensure to add `backupChanges` table to any readwrite transaction.
 * This allows us to avoid specifying this table on every single transaction to allow table hooks to write to
 * our change tracking table.
 *
 * TODO: Add clause to condition to check if backups is enabled
 *  (no reason to add this table to all transactions if backups is off)
 */
function overrideDexieOps(dexie: Dexie) {
    dexie['_createTransaction'] =
        process.env.NODE_ENV === 'test'
            ? dexie['_createTransaction']
            : Dexie.override(
                  dexie['_createTransaction'],
                  origFn => (mode: string, tables: string[], ...args) => {
                      if (
                          mode === 'readwrite' &&
                          !tables.includes('backupChanges')
                      ) {
                          tables = [...tables, 'backupChanges']
                      }
                      return origFn.call(dexie, mode, tables, ...args)
                  },
              )
}

/**
 * WARNING: This should only ever be used by the legacy memex code which relies on Dexie.
 * Any new code should use the storex instance set up in the BG script entrypoint.
 */
const getDb: DBGet = () => db

export default getDb
