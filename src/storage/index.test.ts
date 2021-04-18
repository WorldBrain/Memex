import expect from 'expect'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { getDexieHistory } from '@worldbrain/storex-backend-dexie/lib/schema'
import { DexieSchema } from '@worldbrain/storex-backend-dexie/lib/types'
import patchDirectLinksSchema from 'src/search/storage/dexie-schema'
import { STORAGE_VERSIONS } from './constants'

function normalizeDexieHistory(dexieHistory: DexieSchema[]) {
    const fieldSeparator = ', '
    const normalizeCollectionSchema = (schema: string) => {
        const [first, ...rest] = schema.split(fieldSeparator)
        rest.sort()
        return [first, ...rest].join(fieldSeparator)
    }

    for (const entry of dexieHistory) {
        for (const collectionName of Object.keys(entry.schema)) {
            entry.schema[collectionName] = normalizeCollectionSchema(
                entry.schema[collectionName],
            )
        }
    }

    return dexieHistory
}

describe('Storage initialization', () => {
    it('should generate the correct Dexie schema', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const dexieHistory = patchDirectLinksSchema(
            getDexieHistory(setup.storageManager.registry),
        )

        expect(normalizeDexieHistory(dexieHistory)).toEqual(
            normalizeDexieHistory([
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                    },
                    dexieSchemaVersion: 1,
                    storexSchemaVersion: STORAGE_VERSIONS[0].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks: 'url, *body, *pageTitle, createdWhen',
                    },
                    dexieSchemaVersion: 2,
                    storexSchemaVersion: STORAGE_VERSIONS[0].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_pageTitle_terms, createdWhen',
                    },
                    dexieSchemaVersion: 3,
                    storexSchemaVersion: STORAGE_VERSIONS[1].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_pageTitle_terms, createdWhen',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    },
                    dexieSchemaVersion: 4,
                    storexSchemaVersion: STORAGE_VERSIONS[2].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_pageTitle_terms, createdWhen',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                    },
                    dexieSchemaVersion: 5,
                    storexSchemaVersion: STORAGE_VERSIONS[3].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                    },
                    dexieSchemaVersion: 6,
                    storexSchemaVersion: STORAGE_VERSIONS[4].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                    },
                    dexieSchemaVersion: 7,
                    storexSchemaVersion: STORAGE_VERSIONS[5].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen',
                    },
                    dexieSchemaVersion: 8,
                    storexSchemaVersion: STORAGE_VERSIONS[6].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen',
                        backupChanges: 'timestamp, collection',
                    },
                    dexieSchemaVersion: 9,
                    storexSchemaVersion: STORAGE_VERSIONS[7].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                    },
                    dexieSchemaVersion: 10,
                    storexSchemaVersion: STORAGE_VERSIONS[8].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                    },
                    dexieSchemaVersion: 11,
                    storexSchemaVersion: STORAGE_VERSIONS[9].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                    },
                    dexieSchemaVersion: 12,
                    storexSchemaVersion: STORAGE_VERSIONS[11].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                    },
                    dexieSchemaVersion: 13,
                    storexSchemaVersion: STORAGE_VERSIONS[12].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                    },
                    dexieSchemaVersion: 14,
                    storexSchemaVersion: STORAGE_VERSIONS[13].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                        socialTags: '++id, name, postId',
                        socialPostListEntries: '++id, listId, postId',
                    },
                    dexieSchemaVersion: 15,
                    storexSchemaVersion: STORAGE_VERSIONS[14].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                        socialTags: '++id, name, postId',
                        socialPostListEntries: '++id, listId, postId',
                    },
                    dexieSchemaVersion: 16,
                    storexSchemaVersion: STORAGE_VERSIONS[15].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                        socialTags: '++id, name, postId',
                        socialPostListEntries: '++id, listId, postId',
                    },
                    dexieSchemaVersion: 17,
                    storexSchemaVersion: STORAGE_VERSIONS[16].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, &name, createdAt, isDeletable, isNestable',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                        socialTags: '++id, name, postId',
                        socialPostListEntries: '++id, listId, postId',
                    },
                    dexieSchemaVersion: 18,
                    storexSchemaVersion: STORAGE_VERSIONS[17].version,
                },
                {
                    schema: {
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        visits: '[time+url], url',
                        bookmarks: 'url, time',
                        favIcons: 'hostname',
                        tags: '[name+url], name, url',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        customLists:
                            'id, createdAt, isDeletable, isNestable, name',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        eventLog: '[time+type], time, type',
                        notifications: 'id',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        annotListEntries: '[listId+url], listId, url',
                        annotBookmarks: 'url, createdAt',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialUsers: '++id, name, serviceId, username',
                        socialBookmarks: '++id, createdAt, postId',
                        socialTags: '++id, name, postId',
                        socialPostListEntries: '++id, listId, postId',
                        pageFetchBacklog: '++id, createdAt',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], createdOn',
                        syncDeviceInfo: 'deviceId',
                    },
                    dexieSchemaVersion: 19,
                    storexSchemaVersion: STORAGE_VERSIONS[18].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], createdOn',
                        customLists:
                            'id, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 20,
                    storexSchemaVersion: STORAGE_VERSIONS[19].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], createdOn, needsIntegration, sharedOn',
                        contentSharingAction: '++id, createdWhen',
                        customListDescriptions: 'listId',
                        customLists:
                            'id, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pageListEntryDescriptions: '[listId+pageUrl]',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        readablePageArchives: 'url, createdWhen, lastEdited',
                        sharedListMetadata: 'localId',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 21,
                    storexSchemaVersion: STORAGE_VERSIONS[20].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], [createdOn+sharedOn], createdOn, needsIntegration, sharedOn',
                        contentSharingAction: '++id, createdWhen',
                        customListDescriptions: 'listId',
                        customLists:
                            'id, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pageListEntryDescriptions: '[listId+pageUrl]',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        readablePageArchives: 'url, createdWhen, lastEdited',
                        sharedAnnotationMetadata: 'localId, remoteId',
                        sharedListMetadata: 'localId',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 22,
                    storexSchemaVersion: STORAGE_VERSIONS[21].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], [createdOn+sharedOn], createdOn, needsIntegration, sharedOn',
                        contentSharingAction: '++id, createdWhen',
                        customListDescriptions: 'listId',
                        customLists:
                            'id, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pageListEntryDescriptions: '[listId+pageUrl]',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        readablePageArchives: 'url, createdWhen, lastEdited',
                        readwiseAction: '++id, createdWhen',
                        sharedAnnotationMetadata: 'localId, remoteId',
                        sharedListMetadata: 'localId',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 23,
                    storexSchemaVersion: STORAGE_VERSIONS[22].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], [createdOn+sharedOn], createdOn, needsIntegration, sharedOn',
                        contentSharingAction: '++id, createdWhen',
                        customListDescriptions: 'listId',
                        customLists:
                            'id, *nameTerms, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pageListEntryDescriptions: '[listId+pageUrl]',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        readablePageArchives: 'url, createdWhen, lastEdited',
                        readwiseAction: '++id, createdWhen',
                        sharedAnnotationMetadata: 'localId, remoteId',
                        sharedListMetadata: 'localId',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 24,
                    storexSchemaVersion: STORAGE_VERSIONS[23].version,
                },
                {
                    schema: {
                        annotBookmarks: 'url, createdAt',
                        annotListEntries: '[listId+url], listId, url',
                        annotationPrivacyLevels: 'annotation',
                        annotations:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, lastEdited, pageUrl',
                        backupChanges: 'timestamp, collection',
                        bookmarks: 'url, time',
                        clientSyncLogEntry:
                            '[deviceId+createdOn], [collection+pk], [createdOn+sharedOn], createdOn, needsIntegration, sharedOn',
                        contentSharingAction: '++id, createdWhen',
                        customListDescriptions: 'listId',
                        customLists:
                            'id, *nameTerms, createdAt, isDeletable, isNestable, name',
                        directLinks:
                            'url, *_body_terms, *_comment_terms, *_pageTitle_terms, createdWhen, pageUrl',
                        eventLog: '[time+type], time, type',
                        favIcons: 'hostname',
                        notifications: 'id',
                        pageFetchBacklog: '++id, createdAt',
                        pageListEntries: '[listId+pageUrl], listId, pageUrl',
                        pageListEntryDescriptions: '[listId+pageUrl]',
                        pages:
                            'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                        readablePageArchives: 'url, createdWhen, lastEdited',
                        readwiseAction: '++id, createdWhen',
                        sharedAnnotationMetadata: 'localId, remoteId',
                        sharedListMetadata: 'localId',
                        socialBookmarks: '++id, createdAt, postId',
                        socialPostListEntries: '++id, listId, postId',
                        socialPosts:
                            '++id, *_text_terms, createdAt, serviceId, userId',
                        socialTags: '++id, name, postId',
                        socialUsers: '++id, name, serviceId, username',
                        syncDeviceInfo: 'deviceId',
                        tags: '[name+url], name, url',
                        templates: 'id, code, isFavourite, title',
                        visits: '[time+url], url',
                    },
                    dexieSchemaVersion: 25,
                    storexSchemaVersion: STORAGE_VERSIONS[24].version,
                },
            ]),
        )
    })
})
