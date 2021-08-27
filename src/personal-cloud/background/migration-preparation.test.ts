import type StorageManager from '@worldbrain/storex'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { prepareDataMigration } from './migration-preparation'

const ACTIVE_PAGE_URLS = ['a.com', 'b.com', 'c.com', 'd.com']
const ORPHANED_PAGE_URLS = ['e.com', 'f.com', 'g.com', 'h.com']
const ALL_PAGE_URLS = [...ACTIVE_PAGE_URLS, ...ORPHANED_PAGE_URLS]

async function insertTestData({
    db,
    now,
}: {
    db: StorageManager
    now: number
}) {
    for (const pageUrl of ALL_PAGE_URLS) {
        await db
            .collection('pages')
            .createObject({ url: pageUrl, hostname: pageUrl })
        await db.collection('favIcons').createObject({ hostname: pageUrl })
        await db.collection('visits').createObject({ url: pageUrl, time: now })
        await db
            .collection('visits')
            .createObject({ url: pageUrl, time: now - 1 })
        await db
            .collection('visits')
            .createObject({ url: pageUrl, time: now - 2 })
        await db
            .collection('visits')
            .createObject({ url: pageUrl, time: now - 3 })
    }

    await db.collection('bookmarks').createObject({
        url: ACTIVE_PAGE_URLS[0],
    })

    const annotationUrl = ACTIVE_PAGE_URLS[1] + '/#1234'

    await db.collection('annotations').createObject({
        url: annotationUrl,
        pageUrl: ACTIVE_PAGE_URLS[1],
    })
    await db.collection('annotationPrivacyLevels').createObject({
        annotation: annotationUrl,
    })
    await db.collection('sharedAnnotationMetadata').createObject({
        localId: annotationUrl,
    })

    await db.collection('customLists').createObject({
        id: 123,
    })
    await db.collection('pageListEntries').createObject({
        listId: 123,
        pageUrl: ACTIVE_PAGE_URLS[2],
    })
    await db.collection('sharedListMetadata').createObject({
        localId: 123,
    })

    await db.collection('tags').createObject({
        url: ACTIVE_PAGE_URLS[3],
        name: 'test-tag',
    })
    await db.collection('tags').createObject({
        url: annotationUrl,
        name: 'test-tag',
    })
    await db.collection('settings').createObject({
        key: 'my-setting',
        value: 'hi',
    })
    await db.collection('templates').createObject({
        id: 1,
    })
}

describe('cloud migration preparation tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should process data in specific collection order', async ({
        device,
    }) => {
        const queuedData = new Map<string, any[]>()
        const db = device.storageManager
        const now = Date.now()
        await insertTestData({ db, now })

        await prepareDataMigration({
            db,
            queueObjs: async (collection, objs) => {
                const prev = queuedData.get(collection) ?? []
                queuedData.set(collection, [...prev, ...objs])
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
            'favIcons',
        ])
    })
})
