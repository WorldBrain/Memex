import Dexie from 'dexie'
import Storex from '@worldbrain/storex'
import { Storage } from 'webextension-polyfill-ts'
import textStemmer from '@worldbrain/memex-stemmer'
import { URLNormalizer } from '@worldbrain/memex-url-utils'
import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-storage/lib/lists/constants'

import { ReadwiseBackground } from 'src/readwise-integration/background'
import { STORAGE_KEYS as IDXING_STORAGE_KEYS } from 'src/options/settings/constants'

export interface MigrationProps {
    db: Dexie
    storex: Storex
    normalizeUrl: URLNormalizer
    localStorage: Storage.LocalStorageArea
    backgroundModules: {
        readwise: ReadwiseBackground
    }
}

export interface Migrations {
    [storageKey: string]: (props: MigrationProps) => Promise<void>
}

// __IMPORTANT NOTE__
//     Please note that use of the Dexie `db` instance rather than the `storex` instance won't trigger
//     storage hooks. This may result in inconsistencies - potentially breaking important features!
//     Only use it if you need to change data without triggering side-effects.
// __IMPORTANT NOTE__

export const migrations: Migrations = {
    /*
     * We discovered further complications with our mobile list ID staticization attempts where,
     * as it was not also done on the mobile app, sync entries coming in from the mobile app would
     * still point to the old dynamically created mobile list ID. This migration exists to identify
     * those entries pointing to the old list, that would have been as a result of sync, and point them
     * to the new static list.
     */
    'point-old-mobile-list-entries-to-new': async ({ db }) => {
        const listIdsForPageEntries = await db
            .table('pageListEntries')
            .orderBy('listId')
            .uniqueKeys()
        const matchingListIds = new Set(
            await db
                .table('customLists')
                .where('id')
                .anyOf(listIdsForPageEntries)
                .primaryKeys(),
        )

        // Figure out if there are entries pointing to non-existent lists - one of these will be the old mobile list
        let nonExistentIds: number[] = []
        listIdsForPageEntries.forEach((id) => {
            if (!matchingListIds.has(id)) {
                nonExistentIds.push(id as number)
            }
        })
        if (!nonExistentIds.length) {
            return
        }

        let encounteredDupes = false
        await db
            .table('pageListEntries')
            .where('listId')
            .anyOf(nonExistentIds)
            .modify({
                listId: SPECIAL_LIST_IDS.MOBILE,
            })
            .catch((err) => {
                encounteredDupes = true
            })

        // If modify encountered dupes, do one last sweep to remove them
        if (encounteredDupes) {
            await db
                .table('pageListEntries')
                .where('listId')
                .anyOf(nonExistentIds)
                .delete()
        }
    },
    /*
     * We recently messed up backup by adding our new annotations privacy level table that had an
     * auto-generated PK. The backup log is appended to automatically using a Dexie hook, but at
     * the time the hook runs that generated PK isn't available. But it still appended to the backup log
     * with a missing PK. Hence we needed to update all backup log entries with missing PKs.
     */
    'remove-then-re-add-broken-backup-log-entries': async ({ db }) => {
        // Remove log entries with missing objectPk refs
        const modifiedCount = await db
            .table('backupChanges')
            .toCollection()
            .modify((value, ref) => {
                if (value.objectPk == null) {
                    delete ref.value
                }
            })

        if (!modifiedCount) {
            return
        }

        // Create new log entries with the proper objectPk refs to add in
        const baseTimestamp = Date.now()
        const backupChanges = []
        let offset = 0
        await db
            .table('annotationPrivacyLevels')
            .toCollection()
            .eachPrimaryKey((objectPk) =>
                backupChanges.push({
                    timestamp: baseTimestamp + offset++,
                    collection: 'annotationPrivacyLevels',
                    operation: 'create',
                    objectPk,
                }),
            )

        await db.table('backupChanges').bulkAdd(backupChanges)
    },
    /*
     * We recently added ordering to annotations uploaded to Readwise, however we messed it up for notes (without highlights), causing them
     * to not upload correctly. Now we need to upload all notes.
     */
    'reupload-all-readwise-notes': async ({
        backgroundModules: { readwise },
    }) => {
        const readwiseApiKey = await readwise.getAPIKey()
        if (!readwiseApiKey) {
            return
        }
        const validationResult = await readwise.validateAPIKey({
            key: readwiseApiKey,
        })
        if (!validationResult?.success) {
            return
        }

        await readwise.uploadAllAnnotations({
            queueInteraction: 'queue-and-return',
            annotationFilter: (annot) => !annot.body?.length,
        })
    },
    /*
     * A long time ago we made the decision to make the "Saved from Mobile" list's ID static
     * to simplify references to it. However this was after we'd already rolled the feature out.
     * Anyone who had the extension before then would have the list set with a dynamic ID. To
     * avoid needing to support both cases, here we are migrating everyone over to the static ID.
     */
    'staticize-mobile-list-id': async ({ db }) => {
        let someListFound = false
        let oldListId: number
        await db
            .table('customLists')
            .where('name')
            .equals(SPECIAL_LIST_NAMES.MOBILE)
            .modify((list) => {
                someListFound = true
                if (list.id !== SPECIAL_LIST_IDS.MOBILE) {
                    oldListId = list.id
                    list.id = SPECIAL_LIST_IDS.MOBILE
                }
            })

        // If it doesn't exist, it needs to be created
        if (!someListFound) {
            await db.table('customLists').add({
                searchableName: SPECIAL_LIST_NAMES.MOBILE,
                name: SPECIAL_LIST_NAMES.MOBILE,
                id: SPECIAL_LIST_IDS.MOBILE,
                createdAt: new Date(),
                isDeletable: false,
                isNestable: false,
            })
        }

        if (oldListId != null) {
            await db
                .table('pageListEntries')
                .where('listId')
                .equals(oldListId)
                .modify((entry) => {
                    entry.listId = SPECIAL_LIST_IDS.MOBILE
                })
        }
    },
    /*
     * There was a bug in some annotation refactoring (due to url normalisation)
     * that meant some annotations are created with a full url as the prefixed key
     */
    'normalise-all-annotation-url-keys': async ({
        db,
        storex,
        normalizeUrl,
    }) => {
        const annotations = new Map()

        // go through all annotation urls that begin with http
        await db
            .table('annotations')
            .where('url')
            .startsWith('http')
            .modify((annot) => {
                try {
                    const oldUrl = annot.url

                    // Normalise the part before the '#' id
                    const [url, id] = annot.url.split('#')
                    annot.url = `${normalizeUrl(url)}#${id}`

                    // Save the value for updating it's relations
                    annotations.set(oldUrl, { ...annot, ...{ oldUrl } })
                } catch (e) {
                    console.error('Error migrating old annotation', annot)
                    console.error(e)
                }
            })

        await db
            .table('annotBookmarks')
            .where('url')
            .anyOf([...annotations.keys()])
            .modify((a) => (a.url = annotations.get(a.url).url))
        await db
            .table('tags')
            .where('url')
            .anyOf([...annotations.keys()])
            .modify((a) => (a.url = annotations.get(a.url).url))
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
