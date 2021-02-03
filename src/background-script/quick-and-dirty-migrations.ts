import Dexie from 'dexie'
import Storex from '@worldbrain/storex'
import { Storage } from 'webextension-polyfill-ts'
import textStemmer from '@worldbrain/memex-stemmer'
import { URLNormalizer } from '@worldbrain/memex-url-utils'
import { SPECIAL_LIST_NAMES } from '@worldbrain/memex-storage/lib/lists/constants'

import { STORAGE_KEYS as IDXING_STORAGE_KEYS } from 'src/options/settings/constants'

export interface MigrationProps {
    db: Dexie
    storex: Storex
    normalizeUrl: URLNormalizer
    localStorage: Storage.LocalStorageArea
}

export interface Migrations {
    [storageKey: string]: (props: MigrationProps) => Promise<void>
}

export const migrations: Migrations = {
    /*
     * There was a bug in some annotation refactoring (due to url normalisation)
     * that meant some annotations are created with a full url as the prefixed key
     */
    'normalise-all-annotation-url-keys': async ({
        db,
        storex,
        normalizeUrl,
    }) => {
        // go through all annotation urls that beggin with http

        // update their key to be normalised
        // update their relations to be normalised (annot bookmarks, etc, )
        // update social sharing too? yikes,

        const annotationsNormalised = []

        await db
            .table('annotations')
            .toCollection()
            .filter((annot) => annot.url.startsWith('http'))
            .modify((annot) => {
                try {
                    const oldUrl = annot.url
                    const [url, id] = annot.url.split('#')
                    annot.url = `${normalizeUrl(url)}#${id}`
                    // Save the value for updating it's relations
                    annotationsNormalised.push({ ...annot, ...{ oldUrl } })
                } catch (e) {
                    console.error('Error migrating old annotation', annot)
                    console.error(e)
                }
            })

        for (const annotation of annotationsNormalised) {
            await db
                .table('annotBookmarks')
                .where('url')
                .equals(annotation.oldUrl)
                .modify((a) => (a.url = annotation.url))
            await db
                .table('tags')
                .where('url')
                .equals(annotation.oldUrl)
                .modify((a) => (a.url = annotation.url))
        }

        console.log(
            'Fixed normalisation for annotations',
            annotationsNormalised,
        )
    },
    /*
     * We messed this up due to a bug with our storage layer logic, which means we need to rederive the searchable terms field.
     */
    'searchable-list-name-2': async ({ storex }) => {
        const lists = storex.collection('customLists')
        const data = await lists.findAllObjects<any>({})

        for (const { id, name, nameTerms } of data) {
            if (nameTerms) {
                continue
            }

            await lists.updateOneObject(
                { id },
                { nameTerms: [...textStemmer(name)], searchableName: name },
            )
        }
    },
    /*
     * We wanted to add the ability to search for individual terms that can appear
     * in a list's name. So we've added a 'text' field and this migration populates it
     * with the existing name data.
     */
    'searchable-list-name': async ({ storex }) => {
        const lists = storex.collection('customLists')
        const data = (await lists.findAllObjects<any>({})).filter(
            ({ name }) => !Object.values(SPECIAL_LIST_NAMES).includes(name),
        )

        for (const { id, name } of data) {
            await lists.updateObjects({ id }, { searchableName: name })
        }
    },
    /*
     * Ensure local storage indexing flags are set to disable auto-indexing on visit and
     * enable on-demand indexing on pages that get bookmarked or have annotations created.
     */
    'disable-auto-indexing-on-visit': async ({ localStorage }) => {
        await localStorage.set({
            [IDXING_STORAGE_KEYS.LINKS]: true,
            [IDXING_STORAGE_KEYS.BOOKMARKS]: true,
            [IDXING_STORAGE_KEYS.STUBS]: false,
            [IDXING_STORAGE_KEYS.VISITS]: false,
            [IDXING_STORAGE_KEYS.SCREENSHOTS]: false,
        })
    },
    /*
     * We want to add indicies on two currently optional fields.
     * Add an index on an optional field is fine, it simply results in a sparse index.
     * Though we want to be able to query the entire dataset, hence the need for this migration.
     */
    'fill-out-empty-sync-log-fields': async ({ db }) => {
        await db
            .table('clientSyncLogEntry')
            .toCollection()
            .modify((entry) => {
                entry.sharedOn = entry.sharedOn ?? 0
                entry.needsIntegration = entry.needsIntegration ? 1 : 0
            })
    },
    /*
     * There was a bug in the ext where collection renames weren't also updating
     * the cache, resulting in out-of-sync cache to DB. Therefore seed the
     * collections suggestion cache with entries from the DB.
     */
    'reseed-collections-suggestion-cache': async ({ localStorage, db }) => {
        const cacheStorageKey = 'custom-lists_suggestions'

        const listEntries = await db.table('customLists').limit(10).toArray()
        const newCache: string[] = listEntries.map((entry) => entry.name)

        await localStorage.set({ [cacheStorageKey]: newCache })
    },
    /*
     * If pageUrl is undefined, then re-derive it from url field.
     */
    'annots-undefined-pageUrl-field': async ({ db, normalizeUrl }) => {
        await db
            .table('annotations')
            .toCollection()
            .filter((annot) => annot.pageUrl === undefined)
            .modify((annot) => {
                annot.pageUrl = normalizeUrl(annot.url)
            })
    },
    /*
     * If lastEdited is undefined, then set it to createdWhen value.
     */
    'annots-created-when-to-last-edited': async ({ db }) => {
        await db
            .table('annotations')
            .toCollection()
            .filter(
                (annot) =>
                    annot.lastEdited == null ||
                    (Object.keys(annot.lastEdited).length === 0 &&
                        annot.lastEdited.constructor === Object),
            )
            .modify((annot) => {
                annot.lastEdited = annot.createdWhen
            })
    },
    'unify-duped-mobile-lists': async ({ db }) => {
        const lists = await db
            .table('customLists')
            .where('name')
            .equals(SPECIAL_LIST_NAMES.MOBILE)
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
        await db.table('tags').where('url').equals('').delete()
        await db.table('visits').where('url').equals('').delete()
        await db.table('annotations').where('pageUrl').equals('').delete()
        await db.table('pageListEntries').where('pageUrl').equals('').delete()
    },
    /**
     * There was a bug that caused all page entries added to a custom list to
     * contain a normalized URL as their full URL.
     */
    'denormalize-list-entry-full-urls': async ({ db }) => {
        await db
            .table('pageListEntries')
            .toCollection()
            .modify((entry) => {
                if (entry.fullUrl && !entry.fullUrl.startsWith('http')) {
                    entry.fullUrl = 'http://' + entry.fullUrl
                }
            })
    },
}
