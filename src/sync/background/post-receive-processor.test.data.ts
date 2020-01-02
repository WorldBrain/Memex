import { SharedSyncLogEntry } from '@worldbrain/storex-sync/lib/shared-sync-log/types'

export const bookmarkCreateA: SharedSyncLogEntry<'deserialized-data'> = {
    data: {
        collection: 'bookmarks',
        operation: 'create',
        pk: 'test.com',
        value: {
            url: 'test.com',
            time: 1573020804486,
            fullUrl: 'https://test.com',
        },
        field: '',
    },
    createdOn: 1573020804486,
    deviceId: 'one',
    sharedOn: 1573020804486,
    userId: 'one',
}

export const pageModifyA: SharedSyncLogEntry<'deserialized-data'> = {
    data: {
        collection: 'pages',
        operation: 'modify',
        pk: 'test.com',
        value: { fullTitle: 'test', fullUrl: 'https://test.com' },
        field: 'fullTitle',
    },
    createdOn: 1573020804486,
    deviceId: 'one',
    sharedOn: 1573020804486,
    userId: 'one',
}

export const pageCreateA: SharedSyncLogEntry<'deserialized-data'> = {
    data: {
        collection: 'pages',
        operation: 'create',
        pk: 'test.com',
        value: { url: 'test.com', fullUrl: 'https://test.com' },
        field: '',
    },
    createdOn: 1573020804486,
    deviceId: 'one',
    sharedOn: 1573020804486,
    userId: 'one',
}

export const pageCreateB: SharedSyncLogEntry<'deserialized-data'> = {
    data: {
        collection: 'pages',
        operation: 'create',
        pk: 'test.com',
        value: {
            url: 'test.com',
            domain: 'test.com',
            hostname: 'test.com',
            fullUrl: 'https://test.com',
            fullTitle: 'Test page',
            text: 'This is a test page. Enjoy reading',
        },
        field: '',
    },
    createdOn: 1573020802355,
    deviceId: 'one',
    sharedOn: 1573020802355,
    userId: 'one',
}
