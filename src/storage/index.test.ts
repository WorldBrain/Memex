import expect from 'expect'
import { setupBackgroundIntegrationTest } from 'src/tests/background-integration-tests'
import { getDexieHistory } from '@worldbrain/storex-backend-dexie/lib/schema'

describe('Storage initialization', () => {
    it('should generate the correct Dexie schema', async () => {
        const setup = await setupBackgroundIntegrationTest()
        const dexieHistory = getDexieHistory(setup.storageManager.registry)
        expect(dexieHistory).toEqual([
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                },
                version: 1,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, *_body_terms, createdWhen',
                },
                version: 2,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, createdWhen, *_body_terms, *_pageTitle_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                },
                version: 3,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, *_body_terms, createdWhen',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                },
                version: 4,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                },
                version: 5,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                },
                version: 6,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, *_comment_terms, createdWhen, *_body_terms, *_pageTitle_terms',
                },
                version: 7,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                    annotations:
                        'url, *_pageTitle_terms, *_body_terms, createdWhen, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                },
                version: 8,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, *_comment_terms, createdWhen, *_body_terms, *_pageTitle_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], listId, url',
                },
                version: 9,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                    annotations:
                        'url, *_pageTitle_terms, *_body_terms, createdWhen, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], url, listId',
                    annotBookmarks: 'url, createdAt',
                },
                version: 10,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, pageUrl, *_pageTitle_terms, *_body_terms, createdWhen, lastEdited, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], listId, url',
                    annotBookmarks: 'url, createdAt',
                },
                version: 11,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                    annotations:
                        'url, *_comment_terms, lastEdited, createdWhen, *_body_terms, *_pageTitle_terms, pageUrl',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], url, listId',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, userId, createdAt, serviceId, *_text_terms',
                    socialUsers: '++id, username, name, serviceId',
                },
                version: 12,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, pageUrl, *_pageTitle_terms, *_body_terms, createdWhen, lastEdited, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], listId, url',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, *_text_terms, serviceId, createdAt, userId',
                    socialUsers: '++id, serviceId, name, username',
                    socialBookmarks: '++id, createdAt, postId',
                },
                version: 13,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, createdAt, isNestable, isDeletable, &name',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                    annotations:
                        'url, *_comment_terms, lastEdited, createdWhen, *_body_terms, *_pageTitle_terms, pageUrl',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], url, listId',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, userId, createdAt, serviceId, *_text_terms',
                    socialUsers: '++id, username, name, serviceId',
                    socialBookmarks: '++id, postId, createdAt',
                    socialTags: '++id, postId, name',
                    socialPostListEntries: '++id, postId, listId',
                },
                version: 14,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, pageUrl, *_pageTitle_terms, *_body_terms, createdWhen, lastEdited, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], listId, url',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, *_text_terms, serviceId, createdAt, userId',
                    socialUsers: '++id, serviceId, name, username',
                    socialBookmarks: '++id, createdAt, postId',
                    socialTags: '++id, name, postId',
                    socialPostListEntries: '++id, listId, postId',
                },
                version: 15,
            },
            {
                schema: {
                    pages:
                        'url, hostname, domain, *urlTerms, *titleTerms, *terms',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], url, name',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_comment_terms, createdWhen, *_body_terms, pageUrl, *_pageTitle_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], pageUrl, listId',
                    eventLog: '[time+type], type, time',
                    notifications: 'id',
                    annotations:
                        'url, *_comment_terms, lastEdited, createdWhen, *_body_terms, *_pageTitle_terms, pageUrl',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], url, listId',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, userId, createdAt, serviceId, *_text_terms',
                    socialUsers: '++id, username, name, serviceId',
                    socialBookmarks: '++id, postId, createdAt',
                    socialTags: '++id, postId, name',
                    socialPostListEntries: '++id, postId, listId',
                },
                version: 16,
            },
            {
                schema: {
                    pages:
                        'url, *terms, *titleTerms, *urlTerms, domain, hostname',
                    visits: '[time+url], url',
                    favIcons: 'hostname',
                    tags: '[name+url], name, url',
                    bookmarks: 'url, time',
                    directLinks:
                        'url, *_pageTitle_terms, pageUrl, *_body_terms, createdWhen, *_comment_terms',
                    customLists:
                        'id, &name, isDeletable, isNestable, createdAt',
                    pageListEntries: '[listId+pageUrl], listId, pageUrl',
                    eventLog: '[time+type], time, type',
                    notifications: 'id',
                    annotations:
                        'url, pageUrl, *_pageTitle_terms, *_body_terms, createdWhen, lastEdited, *_comment_terms',
                    backupChanges: 'timestamp, collection',
                    annotListEntries: '[listId+url], listId, url',
                    annotBookmarks: 'url, createdAt',
                    socialPosts:
                        '++id, *_text_terms, serviceId, createdAt, userId',
                    socialUsers: '++id, serviceId, name, username',
                    socialBookmarks: '++id, createdAt, postId',
                    socialTags: '++id, name, postId',
                    socialPostListEntries: '++id, listId, postId',
                },
                version: 17,
            },
        ])
    })
})
