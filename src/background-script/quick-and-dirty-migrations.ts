import Dexie from 'dexie'
import { URLNormalizer } from '@worldbrain/memex-url-utils'
import { MOBILE_LIST_NAME } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/constants'

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
    'unify-duped-mobile-lists': async ({ db }) => {
        const lists = await db
            .table('customLists')
            .where('name')
            .equals(MOBILE_LIST_NAME)
            .toArray()

        if (lists.length < 2) {
            return
        }

        const entries = [
            await db
                .table('pageListEntries')
                .where('listId')
                .equals(lists[0].id)
                .toArray(),
            await db
                .table('pageListEntries')
                .where('listId')
                .equals(lists[1].id)
                .toArray(),
        ] as any[]

        const listToKeep = entries[0].length > entries[1].length ? 0 : 1
        const listToRemove = listToKeep === 0 ? 1 : 0

        for (const entry of entries[listToRemove]) {
            await db
                .table('pageListEntries')
                .put({ ...entry, listId: lists[listToKeep].id })
        }

        await db
            .table('pageListEntries')
            .where('listId')
            .equals(lists[listToRemove].id)
            .delete()
        await db
            .table('customLists')
            .where('id')
            .equals(lists[listToRemove].id)
            .delete()
    },
    /*
     * There was a bug in the mobile app where new page meta data could be created for
     * a page shared from an unsupported app, meaning the URL (the main field used to
     * associate meta data with pages) was empty.
     */
    'remove-empty-url': async ({ db }) => {
        await db
            .table('tags')
            .where('url')
            .equals('')
            .delete()
        await db
            .table('visits')
            .where('url')
            .equals('')
            .delete()
        await db
            .table('annotations')
            .where('pageUrl')
            .equals('')
            .delete()
        await db
            .table('pageListEntries')
            .where('pageUrl')
            .equals('')
            .delete()
    },
}
