import type Dexie from 'dexie'
import {
    makeSingleDeviceUILogicTestFactory,
    UILogicTestDevice,
} from 'src/tests/ui-logic-tests'
import { prepareDataMigration } from './migration-preparation'

const ACTIVE_PAGE_URLS = ['a.com', 'b.com', 'c.com', 'd.com']
const ORPHANED_PAGE_URLS = ['e.com', 'f.com', 'g.com', 'h.com']
const ALL_PAGE_URLS = [...ACTIVE_PAGE_URLS, ...ORPHANED_PAGE_URLS]

async function insertTestData({ db, now }: { db: Dexie; now: number }) {
    for (const pageUrl of ALL_PAGE_URLS) {
        await db.table('pages').put({ url: pageUrl, hostname: pageUrl })
        await db.table('favIcons').put({ hostname: pageUrl })
        await db.table('visits').put({ url: pageUrl, time: now })
        await db.table('visits').put({ url: pageUrl, time: now - 1 })
        await db.table('visits').put({ url: pageUrl, time: now - 2 })
        await db.table('visits').put({ url: pageUrl, time: now - 3 })
    }

    await db.table('bookmarks').put({
        url: ACTIVE_PAGE_URLS[0],
    })

    const annotationUrl = ACTIVE_PAGE_URLS[1] + '/#1234'

    await db.table('annotations').put({
        url: annotationUrl,
        pageUrl: ACTIVE_PAGE_URLS[1],
    })
    await db.table('annotationPrivacyLevels').put({
        annotation: annotationUrl,
    })
    await db.table('sharedAnnotationMetadata').put({
        localId: annotationUrl,
    })

    await db.table('customLists').put({
        id: 123,
    })
    await db.table('pageListEntries').put({
        listId: 123,
        pageUrl: ACTIVE_PAGE_URLS[2],
    })
    await db.table('sharedListMetadata').put({
        localId: 123,
    })

    await db.table('tags').put({
        url: ACTIVE_PAGE_URLS[3],
        name: 'test-tag',
    })
    await db.table('tags').put({
        url: annotationUrl,
        name: 'test-tag',
    })
    await db.table('settings').put({
        key: 'my-setting',
        value: 'hi',
    })
    await db.table('templates').put({
        id: 1,
    })
}

describe('cloud migration preparation tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    async function runTest(device: UILogicTestDevice, chunkSize: number) {
        const queuedData = new Map<string, any[]>()
        const db = device.storageManager.backend['dexie'] as Dexie
        const now = Date.now()
        await insertTestData({ db, now })

        await prepareDataMigration({
            db,
            chunkSize,
            resetQueue: async () => queuedData.clear(),
            queueObjs: async (actionData) => {
                const prev = queuedData.get(actionData.collection) ?? []
                queuedData.set(actionData.collection, [
                    ...prev,
                    ...actionData.objs,
                ])
            },
        })

        expect([...queuedData.keys()]).toEqual([
            'pages',
            'visits',
            'bookmarks',
            'annotations',
            'annotationPrivacyLevels',
            'sharedAnnotationMetadata',
            'customLists',
            'pageListEntries',
            'sharedListMetadata',
            'tags',
            'settings',
            'templates',
        ])
    }

    it('should process data in specific collection order', async ({ device }) =>
        runTest(device, 350))

    it('should work with different chunk sizes', async ({ device }) => {
        for (const chunkSize of [1, 10, 50, 100, 500, 1000]) {
            await runTest(device, chunkSize)
        }
    })
})
