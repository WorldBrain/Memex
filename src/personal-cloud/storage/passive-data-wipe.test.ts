import type Dexie from 'dexie'
import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { wipePassiveData } from './passive-data-wipe'

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
    now: number
    expectExtraVisits?: () => any[]
}) {
    expect(await args.db.table('pages').get(args.pageUrl)).toEqual(
        args.exists ? { url: args.pageUrl, hostname: args.pageUrl } : undefined,
    )
    expect(await args.db.table('favIcons').get(args.pageUrl)).toEqual(
        args.exists ? { hostname: args.pageUrl } : undefined,
    )

    const expectedVisits = args.expectExtraVisits?.() ?? [
        { url: args.pageUrl, time: args.now - 3 },
        { url: args.pageUrl, time: args.now - 2 },
        { url: args.pageUrl, time: args.now - 1 },
        { url: args.pageUrl, time: args.now },
    ]

    expect(
        await args.db
            .table('visits')
            .where('url')
            .equals(args.pageUrl)
            .toArray(),
    ).toEqual(args.exists ? expectedVisits : [])
}

describe('passive data wipe tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should not delete pages with associated data while deleting those without', async ({
        device,
    }) => {
        const db: Dexie = device.storageManager.backend['dexie']
        const now = Date.now()
        await insertTestData({ db, now })

        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true, now }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true, now }),
            ),
        ])

        await wipePassiveData({ db, visitLimit: 100 })

        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true, now }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: false, now }),
            ),
        ])
    })

    it('should delete all but oldest visit when page has more than visit limit', async ({
        device,
    }) => {
        const db: Dexie = device.storageManager.backend['dexie']
        const now = Date.now()
        await insertTestData({ db, now })

        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true, now }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: true, now }),
            ),
        ])

        // Add some extra visits on two pages, that exceed the visit limit
        const now2 = now + 10
        const extraVisits1 = []
        const extraVisits2 = []
        const [activePage1, activePage2] = ACTIVE_PAGE_URLS
        for (let i = 9; i >= 0; i--) {
            extraVisits1.push({ url: activePage1, time: now2 - i })
            extraVisits2.push({ url: activePage2, time: now2 - i })
        }
        await db.table('visits').bulkPut([...extraVisits1, ...extraVisits2])

        await Promise.all(
            ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({
                    db,
                    pageUrl,
                    exists: true,
                    now: [activePage1, activePage2].includes(pageUrl)
                        ? now2
                        : now,
                    expectExtraVisits: () => {
                        const origVisits = [
                            { url: pageUrl, time: now - 3 },
                            { url: pageUrl, time: now - 2 },
                            { url: pageUrl, time: now - 1 },
                            { url: pageUrl, time: now },
                        ]

                        if (pageUrl === activePage1) {
                            return [...origVisits, ...extraVisits1]
                        } else if (pageUrl === activePage2) {
                            return [...origVisits, ...extraVisits2]
                        } else {
                            return origVisits
                        }
                    },
                }),
            ),
        )

        await wipePassiveData({ db, visitLimit: 4 })

        // The exact same assertions should pass as before those extra visits were added
        await Promise.all([
            ...ACTIVE_PAGE_URLS.map((pageUrl) =>
                assertPageExists({
                    db,
                    pageUrl,
                    exists: true,
                    now: [activePage1, activePage2].includes(pageUrl)
                        ? now2
                        : now,
                }),
            ),
            ...ORPHANED_PAGE_URLS.map((pageUrl) =>
                assertPageExists({ db, pageUrl, exists: false, now }),
            ),
        ])
    })
})
