import { Dexie } from 'src/search/types'

export interface Migrations {
    [storageKey: string]: (db: Dexie) => Promise<void>
}

export const migrations: Migrations = {
    /**
     * If lastEdited is undefined, then set it to createdWhen value.
     */
    'annots-created-when-to-last-edited': async db => {
        await db
            .table('annotations')
            .toCollection()
            .filter(
                annot =>
                    annot.lastEdited == null ||
                    (Object.keys(annot.lastEdited).length === 0 &&
                        annot.lastEdited.constructor === Object),
            )
            .modify(annot => {
                annot.lastEdited = annot.createdWhen
            })
    },
}
