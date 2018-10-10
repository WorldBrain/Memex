import Dexie from 'dexie'

import { StorageManager } from '../types'

export abstract class FeatureStorage {
    constructor(protected storageManager: StorageManager) {}
}

/**
 * Error hanlder captures `OpenFailedError`s relating to `createObjectStore` IDB issues,
 * allowing all other errors to get thrown. We do this as some users experience a fatal issue
 * with this error rendering the DB unusable, but spamming our sentry error tracker.
 */
export const initErrHandler = <T>(defReturnVal: T = null) => (
    err: Dexie.DexieError,
) => {
    if (
        err.message === 'Data fetch failed' ||
        (err.name === Dexie.errnames.OpenFailed &&
            err.message.includes('createObjectStore'))
    ) {
        return defReturnVal
    }

    throw err
}

/**
 * Overrides `Dexie._createTransaction` to ensure to add `backupChanges` table to any readwrite transaction.
 * This allows us to avoid specifying this table on every single transaction to allow table hooks to write to
 * our change tracking table.
 *
 * TODO: Add clause to condition to check if backups is enabled
 *  (no reason to add this table to all transactions if backups is off)
 */
// private _createTransaction =
//     process.env.NODE_ENV === 'test'
//         ? this._createTransaction
//         : Dexie.override(
//                 this._createTransaction,
//                 origFn => (mode: string, tables: string[], ...args) => {
//                     if (
//                         mode === 'readwrite' &&
//                         !tables.includes(this.backupTable)
//                     ) {
//                         tables = [...tables, this.backupTable]
//                     }
//                     return origFn.call(this, mode, tables, ...args)
//                 },
//             )
