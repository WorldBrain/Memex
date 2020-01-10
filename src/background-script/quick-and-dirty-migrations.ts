import Dexie from 'dexie'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

export interface Migrations {
    [storageKey: string]: (db: Dexie) => Promise<void>
}

export const migrations: Migrations = {
    /**
     * If pageUrl is undefined, then re-derive it from url field.
     */
    'annots-undefined-pageUrl-field': async db => {
        await db
            .table('annotations')
            .toCollection()
            .filter(annot => annot.pageUrl === undefined)
            .modify(annot => {
                annot.pageUrl = normalizeUrl(annot.url)
            })
    },
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
