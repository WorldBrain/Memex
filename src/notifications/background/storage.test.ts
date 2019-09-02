import expect from 'expect'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

import { READ, UNREAD } from './storage.test.data'
import Storage from './storage'
import initStorageManager from 'src/search/memory-storex'

describe('notification storage tests', () => {
    async function setupTest() {
        const storageManager = initStorageManager()
        const storage = new Storage({ storageManager })
        registerModuleMapCollections(storageManager.registry, {
            notifications: storage,
        })
        await storageManager.finishInitialization()

        await Promise.all(READ.map(notif => storage.storeNotification(notif)))
        await Promise.all(UNREAD.map(notif => storage.storeNotification(notif)))

        return { storage }
    }

    it('should be able to fetch unread notifs', async () => {
        const { storage } = await setupTest()

        const notifs = await storage.fetchUnreadNotifications()
        expect(notifs.length).toBe(3)
        expect(notifs).toEqual(expect.arrayContaining(UNREAD))
    })

    it('should be able to fetch read notifs', async () => {
        const { storage } = await setupTest()

        const { notifications: notifs } = await storage.fetchReadNotifications(
            {},
        )
        expect(notifs.length).toBe(3)
        expect(notifs).toEqual(expect.arrayContaining(READ))
    })

    it('should be able to mark notif as read', async () => {
        const { storage } = await setupTest()

        const id = UNREAD[0].id
        const before = await storage.fetchNotifById(id)
        await storage.readNotification(id)
        const after = await storage.fetchNotifById(id)

        expect(before.readTime).not.toBeDefined()
        expect(after.readTime).toBeDefined()
    })
})
