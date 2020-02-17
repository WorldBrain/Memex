import Dexie from 'dexie'
import { URLNormalizer } from '@worldbrain/memex-url-utils'

export interface MigrationProps {
    db: Dexie
    normalizeUrl: URLNormalizer
}

export interface Migrations {
    [storageKey: string]: (props: MigrationProps) => Promise<void>
}

export const migrations: Migrations = {
    /**
     * If pageUrl is undefined, then re-derive it from url field.
     */
    'annots-undefined-pageUrl-field': async ({ db, normalizeUrl }) => {
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
    'annots-created-when-to-last-edited': async ({ db }) => {
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
