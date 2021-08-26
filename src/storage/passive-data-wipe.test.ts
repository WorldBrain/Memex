import type Dexie from 'dexie'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { wipePassiveData } from './passive-data-wipe'

const ACTIVE_PAGE_URLS = ['a.com', 'b.com', 'c.com', 'd.com']
const ORPHANED_PAGE_URLS = ['e.com', 'f.com', 'g.com', 'h.com']
const ALL_PAGE_URLS = [...ACTIVE_PAGE_URLS, ...ORPHANED_PAGE_URLS]

async function insertTestData({ db }: { db: Dexie }) {
    for (const pageUrl of ALL_PAGE_URLS) {
        await db.table('pages').put({ url: pageUrl, hostname: pageUrl })
        await db.table('favIcons').put({ hostname: pageUrl })
    }

    await db.table('bookmarks').put({
        url: ACTIVE_PAGE_URLS[0],
    })
    await db.table('annotations').put({
        url: ACTIVE_PAGE_URLS[1] + '/#1234',
        pageUrl: ACTIVE_PAGE_URLS[1],
    })
    await db.table('pageListEntries').put({
        listId: 123,
        pageUrl: ACTIVE_PAGE_URLS[2],
    })
    await db.table('tags').put({
        url: ACTIVE_PAGE_URLS[3],
        name: 'test-tag',
    })
}

async function assertPageExists(args: {
    db: Dexie
    pageUrl: string
    exists: boolean
}) {
    expect(await args.db.table('pages').get(args.pageUrl)).toEqual(
        args.exists ? { url: args.pageUrl, hostname: args.pageUrl } : undefined,
    )
    expect(await args.db.table('favIcons').get(args.pageUrl)).toEqual(
        args.exists ? { hostname: args.pageUrl } : undefined,
    )
}

describe('passive data wipe tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should not delete pages with associated data', async ({ device }) => {
        const db: Dexie = device.storageManager.backend['dexie']
        await insertTestData({ db })

        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true }),
            ),
        ])

        await wipePassiveData({ db })

        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: false }),
            ),
        ])
    })
})
