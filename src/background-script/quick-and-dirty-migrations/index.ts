import type Dexie from 'dexie'
import type Storex from '@worldbrain/storex'
import type { Storage } from 'webextension-polyfill'
import type { URLNormalizer } from '@worldbrain/memex-url-utils'
import {
    SPECIAL_LIST_NAMES,
    SPECIAL_LIST_IDS,
} from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import textStemmer from '@worldbrain/memex-stemmer'
import { STORAGE_KEYS as IDXING_STORAGE_KEYS } from 'src/options/settings/constants'
import type { BackgroundModules } from '../setup'
import {
    createSyncSettingsStore,
    SyncSettingsStore,
} from 'src/sync-settings/util'
import { SETTING_NAMES } from 'src/sync-settings/background/constants'
import { migrateInstallTime } from 'src/personal-cloud/storage/migrate-install-time'
import type { LocalExtensionSettings } from '../types'
import type { SettingStore, BrowserSettingsStore } from 'src/util/settings'
import { __OLD_INSTALL_TIME_KEY } from 'src/constants'
import { migrateTagsToSpaces } from './tags-migration'
import { PersonalCloudActionType } from 'src/personal-cloud/background/types'
import { PersonalCloudUpdateType } from '@worldbrain/memex-common/lib/personal-cloud/backend/types'
import type { SharedListMetadata } from 'src/content-sharing/background/types'
import type { BatchOperation, OperationBatch } from '@worldbrain/storex'
import { ROOT_NODE_PARENT_ID } from '@worldbrain/memex-common/lib/content-sharing/tree-utils'
import {
    DEFAULT_KEY,
    DEFAULT_SPACE_BETWEEN,
    defaultOrderableSorter,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import { HIGHLIGHT_COLOR_KEY } from 'src/highlighting/constants'
import { DEFAULT_HIGHLIGHT_COLOR } from '@worldbrain/memex-common/lib/annotations/constants'
import type { SyncSettingsByFeature } from 'src/sync-settings/background/types'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'
import type { CustomListTree } from '@worldbrain/memex-common/lib/types/core-data-types/client'

export interface MigrationProps {
    db: Dexie
    storex: Storex
    normalizeUrl: URLNormalizer
    localStorage: Storage.LocalStorageArea
    bgModules: Pick<
        BackgroundModules,
        | 'readwise'
        | 'syncSettings'
        | 'personalCloud'
        | 'pageActivityIndicator'
        | 'auth'
        | 'customLists'
        | 'contentSharing'
        | 'copyPaster'
    >
    localExtSettingStore: SettingStore<LocalExtensionSettings>
    syncSettingsStore: SyncSettingsStore<'extension'>
}

export interface Migrations {
    [storageKey: string]: (props: MigrationProps) => Promise<void>
}

export const MIGRATION_PREFIX = '@QnDMigration-'

// __IMPORTANT NOTE__
//     Please note that use of the Dexie `db` instance rather than the `storex` instance won't trigger
//     storage hooks. This may result in inconsistencies - potentially breaking important features!
//     Only use it if you need to change data without triggering side-effects.
// __IMPORTANT NOTE__

export const migrations: Migrations = {
    /*
     * This exists as I messed up the order assignments for new lists, which get inserted at the beginning.
     * Previously they got order set to half of whatever the prev first list's order was. Though things
     * can only be halved for so long (not long). This recalculates the order value for all of them, assigning the middle key
     * (between 0 and MAX_INT) to the middle list, then all others get offset from there by 2**32.
     * You can fit ~2 million 2**32s in that entire number space.
     * The actual user-facing order should not change.
     */
    [MIGRATION_PREFIX + 'reset-list-tree-order-01']: async ({
        storex,
        bgModules,
    }) => {
        await bgModules.personalCloud.waitForSync()
        const nodes: CustomListTree[] = await storex
            .collection('customListTrees')
            .findAllObjects({})
        const nodesByParent = new Map<number, CustomListTree[]>()

        // Group tree nodes as siblings
        for (const node of nodes) {
            const siblingTrees = nodesByParent.get(node.parentListId) ?? []
            siblingTrees.push(node)
            nodesByParent.set(node.parentListId, siblingTrees)
        }

        const batch: OperationBatch = []

        for (const nodes of nodesByParent.values()) {
            nodes.sort(defaultOrderableSorter)
            const middleIdx = Math.floor(nodes.length / 2)
            for (let idx = 0; idx < nodes.length; idx++) {
                const orderOffest = (idx - middleIdx) * DEFAULT_SPACE_BETWEEN
                nodes[idx].order =
                    idx === middleIdx ? DEFAULT_KEY : DEFAULT_KEY + orderOffest
            }

            batch.push(
                ...nodes.map((node) => ({
                    operation: 'updateObjects' as const,
                    collection: 'customListTrees',
                    placeholder: `tree-reorder-${node.id}`,
                    where: { id: node.id },
                    updates: { order: node.order },
                })),
            )
        }

        if (batch.length) {
            await storex.operation('executeBatch', batch)
        }
    },
    /*
     * This exists as we added an `order` field to templates collection when
     * we realized the importance of being able to order your templates in the text
     * exporter list
     */
    [MIGRATION_PREFIX + 'set-order-for-templates-01']: async ({
        bgModules,
        storex,
    }) => {
        const templates = await bgModules.copyPaster.findAllTemplates()
        const batch: OperationBatch = templates
            .filter((template) => template.order == null)
            .map((template, i) => ({
                operation: 'updateObjects',
                collection: 'templates',
                placeholder: `template-${template.id}`,
                where: { id: template.id },
                updates: { order: DEFAULT_KEY + i * DEFAULT_SPACE_BETWEEN },
            }))
        if (batch.length) {
            await storex.operation('executeBatch', batch)
        }
    },
    /*
     * This exists as the main default highlight color was living in local storage while we had since moved custom
     * highlight colors to live in sync settings (DB coll). This moves the local storage default highlight color to
     * be an additional entry in the sync settings highlight colors, or creates them if not already present in sync settings.
     */
    [MIGRATION_PREFIX +
    'reconcile-highlight-colors-in-synced-settings-storage-01']: async ({
        bgModules,
        localStorage,
    }) => {
        const {
            [HIGHLIGHT_COLOR_KEY]: defaultHighlightColor,
        } = await localStorage.get({
            [HIGHLIGHT_COLOR_KEY]: DEFAULT_HIGHLIGHT_COLOR,
        })

        let syncedHighlightColors = (
            await bgModules.syncSettings.get(
                SETTING_NAMES.highlightColors.highlightColors,
            )
        )[
            SETTING_NAMES.highlightColors.highlightColors
        ] as SyncSettingsByFeature['highlightColors']['highlightColors']

        if (!syncedHighlightColors) {
            syncedHighlightColors = HIGHLIGHT_COLORS_DEFAULT
        } else {
            syncedHighlightColors.unshift({
                ...HIGHLIGHT_COLORS_DEFAULT[0],
                color: defaultHighlightColor,
            })
        }

        await bgModules.syncSettings.set({
            [SETTING_NAMES.highlightColors
                .highlightColors]: syncedHighlightColors,
        })
    },
    /*
     * This removes then recreates all the backupChanges docs for collections that have an auto-incrementing PK.
     * We had a bug in our incremental backup implementation where it was creating backupChanges docs via a Dexie hook,
     * though Dexie hooks run before create and thus don't have access to the PK at time of running. We since moved
     * that to work via a storex middleware, which runs post-creation.
     */
    [MIGRATION_PREFIX + 'recreate-auto-inc-pk-colls-backup-changes-0']: async ({
        storex,
        bgModules,
    }) => {
        const autoIncPkCollections = [
            'annotationPrivacyLevels',
            'locators',
            'customListTrees',
        ]
        const startTime = Date.now()

        await storex
            .collection('backupChanges')
            .deleteObjects({ collection: { $in: autoIncPkCollections } })

        const batch: OperationBatch = []
        let totalDocs = 0
        async function createBackupEntriesForCollection(
            collection: string,
            pageSize = 100,
        ): Promise<void> {
            let page = 0
            let chunkDocs: Array<{ id: number }>
            while (true) {
                chunkDocs = await storex
                    .collection(collection)
                    .findObjects({}, { limit: pageSize, skip: page * pageSize })

                batch.push(
                    ...chunkDocs.map((doc, i) => ({
                        collection: 'backupChanges',
                        operation: 'createObject' as const,
                        placeholder: `${collection}-${page}-${i}`,
                        args: {
                            collection,
                            objectPk: doc.id,
                            operation: 'create',
                            timestamp: startTime + totalDocs++, // TODO: will this be a problem?
                        },
                    })),
                )
                page++
                if (chunkDocs.length !== pageSize) {
                    break
                }
            }
        }

        for (const collection of autoIncPkCollections) {
            await createBackupEntriesForCollection(collection)
        }
        await storex.operation('executeBatch', batch)
    },
    /*
     * This exists as we added a new `customListTrees` collection for the nested lists feature, where
     * a doc is assumed to exist for each `customLists` doc.
     */
    [MIGRATION_PREFIX + 'create-tree-data-for-lists-01']: async ({
        bgModules,
        storex,
    }) => {
        const now = Date.now()
        const PAGE_SIZE = 50
        let page = 0
        let batchCount = 0
        const batch: OperationBatch = []
        while (true) {
            const listResults = await bgModules.customLists.storage.fetchAllLists(
                {
                    limit: PAGE_SIZE,
                    skip: page * PAGE_SIZE,
                    skipSpecialLists: false,
                    includeDescriptions: false,
                },
            )
            const listsToProcess = listResults.filter(
                (list) =>
                    !Object.values(SPECIAL_LIST_IDS).includes(list.id) &&
                    list.name !== SPECIAL_LIST_NAMES.MOBILE,
            )
            const treeData = await bgModules.customLists.storage.getTreeDataForLists(
                {
                    localListIds: listsToProcess.map((list) => list.id),
                },
            )

            batch.push(
                ...listsToProcess
                    .filter((list) => treeData[list.id] == null) // Skip any that already have tree data
                    .map(
                        (list) =>
                            ({
                                operation: 'createObject',
                                collection: 'customListTrees',
                                placeholder: `list-tree-${batchCount}`,
                                args: {
                                    listId: list.id,
                                    linkTarget: null,
                                    path: null,
                                    parentListId: ROOT_NODE_PARENT_ID,
                                    order:
                                        DEFAULT_KEY +
                                        (batchCount += DEFAULT_SPACE_BETWEEN),
                                    createdWhen: now,
                                    updatedWhen: now,
                                },
                            } as BatchOperation),
                    ),
            )

            if (listResults.length !== PAGE_SIZE) {
                break
            }
            page++
        }

        if (batch.length) {
            await storex.operation('executeBatch', batch)
        }
    },
    /*
     * This is sharing all private lists taht have not yet a remoteId
     */
    [MIGRATION_PREFIX + 'share-unshared-lists-and-entries']: async ({
        bgModules,
    }) => {
        const localListsData = await bgModules.customLists.fetchAllLists({})

        const localListIds = localListsData.map((list) => list.id)

        let listMetadataFetch: {
            [localListId: number]: SharedListMetadata
        } = await bgModules.contentSharing.getListShareMetadata({
            localListIds: localListIds,
        })

        let sharedListsLocalIds = []

        for (let list in listMetadataFetch) {
            sharedListsLocalIds.push(listMetadataFetch[list].localId)
        }

        const differenceList = localListIds.filter(
            (x) => !sharedListsLocalIds.includes(x),
        )

        for (let list of differenceList) {
            await bgModules.contentSharing.scheduleListShare({
                localListId: list,
                isPrivate: true,
            })
        }
    },
    /*
     * This exists as we made some schema changes to the followedList* collections, adding `type` field
     * to followedList for page-link lists. And adding `sharedListEntry` field to followedListEntry acting
     * as a reference to the server-side collection of the same name. Thus they need to be re-pulled
     */
    [MIGRATION_PREFIX + 'trigger-reinit-followed-list-pull-resync-01']: async ({
        bgModules,
        storex,
    }) => {
        await bgModules.auth.authService.waitForAuthReady()
        await storex.backend.operation('deleteObjects', 'followedList', {})
        await storex.backend.operation('deleteObjects', 'followedListEntry', {})
        await bgModules.pageActivityIndicator.syncFollowedLists()
        await bgModules.pageActivityIndicator.syncFollowedListEntries()
    },
    /*
     * This exists to seed initial local followedList collection data based on remote data, for the
     * release of the page-activity indicator feature. Future changes to this collection should be
     * handled by cloud sync.
     */
    [MIGRATION_PREFIX + 'trigger-init-followed-list-pull-sync']: async ({
        bgModules,
    }) => {
        await bgModules.pageActivityIndicator.syncFollowedLists()
    },
    [MIGRATION_PREFIX + 'migrate-tags-to-spaces']: async ({
        bgModules: { personalCloud },
        syncSettingsStore,
        db,
    }) => {
        const alreadyMigratedOnAnotherDevice = await syncSettingsStore.extension.get(
            'areTagsMigratedToSpaces',
        )
        if (alreadyMigratedOnAnotherDevice) {
            return
        }

        await migrateTagsToSpaces({
            dexie: db,
            queueChangesForCloudSync: async ({ collection, objs }) =>
                personalCloud.actionQueue.scheduleManyActions(
                    objs.map((object) => ({
                        type: PersonalCloudActionType.PushObject,
                        updates: [
                            {
                                collection,
                                deviceId: personalCloud.deviceId!,
                                type: PersonalCloudUpdateType.Overwrite,
                                schemaVersion: personalCloud.currentSchemaVersion!,
                                object: personalCloud.preprocessObjectForPush({
                                    collection,
                                    object,
                                }),
                            },
                        ],
                    })),
                    { queueInteraction: 'queue-and-return' },
                ),
        })

        await syncSettingsStore.extension.set('areTagsMigratedToSpaces', true)
    },
    /*
     * This is the migration to bring over old pre-cloud user data to the new cloud-based
     * model. Previously this was done by version number in the calling BG script class, though
     * that didn't work nicely to cover 100% of users with our frequent hotfix releases post-cloud release.
     */
    [MIGRATION_PREFIX + 'migrate-to-cloud']: async ({
        localExtSettingStore,
        storex: storageManager,
        bgModules: backgroundModules,
    }) => {
        if ((await localExtSettingStore.get('installTimestamp')) != null) {
            return
        }

        const syncSettings = createSyncSettingsStore({
            syncSettingsBG: backgroundModules.syncSettings,
        })
        await syncSettings.dashboard.set(
            'subscribeBannerShownAfter',
            Date.now(),
        )
        await backgroundModules.syncSettings.__migrateLocalStorage()
        await migrateInstallTime({
            storageManager,
            getOldInstallTime: () =>
                (localExtSettingStore as BrowserSettingsStore<any>).__rawGet(
                    __OLD_INSTALL_TIME_KEY,
                ),
            setInstallTime: (time) =>
                localExtSettingStore.set('installTimestamp', time),
        })
    },
    /*
     * Post 3.0.0 cloud release, we forgot to migrate the users' Readwise keys from local storage to
     * the new synced settings collection. This meant that Readwise integration stopped working until
     * the user re-entered their API key.
     */
    [MIGRATION_PREFIX + 'migrate-readwise-key']: async ({
        bgModules: backgroundModules,
        localStorage,
    }) => {
        // Note I'm using the constant for the synced settings here because the name is the same as the old local storage key name
        const {
            [SETTING_NAMES.readwise.apiKey]: oldKey,
        } = await localStorage.get(SETTING_NAMES.readwise.apiKey)

        const cloudReleaseDate = new Date('2021-10-13T04:00:00.000+00:00')

        if (!oldKey) {
            return
        }

        const syncSettings = createSyncSettingsStore({
            syncSettingsBG: backgroundModules.syncSettings,
        })

        await syncSettings.readwise.set('apiKey', oldKey)
        await backgroundModules.readwise.uploadAllAnnotations({
            annotationFilter: ({ createdWhen, lastEdited }) =>
                createdWhen > cloudReleaseDate || lastEdited > cloudReleaseDate,
        })
    },
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
    // 'reupload-all-readwise-notes': async ({
    //     backgroundModules: { readwise },
    // }) => {
    //     const readwiseApiKey = await readwise.getAPIKey()
    //     if (!readwiseApiKey) {
    //         return
    //     }
    //     const validationResult = await readwise.validateAPIKey({
    //         key: readwiseApiKey,
    //     })
    //     if (!validationResult?.success) {
    //         return
    //     }

    //     await readwise.uploadAllAnnotations({
    //         queueInteraction: 'queue-and-return',
    //         annotationFilter: (annot) => !annot.body?.length,
    //     })
    // },
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

        const listEntries = await db.table('customLists').limit(1000).toArray()
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
