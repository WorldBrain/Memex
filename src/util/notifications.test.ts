import { Creator } from './notifications'

const NOTIF_1 = {
    message: 'test',
    title: 'test',
    requireInteraction: true,
    ...Creator.DEF_OPTS,
}

const { requireInteraction, ...NOTIF_1_FF } = NOTIF_1

class MockNotifsAPI {
    clearedId?: string
    notif?: any

    create(notif: any) {
        this.notif = notif
    }

    clear(id: string) {
        this.clearedId = id
    }
}

function setupTest({ isChrome }: { isChrome: boolean }) {
    const notificationsAPI = new MockNotifsAPI()
    const creator = new Creator({
        notificationsAPI: notificationsAPI as any,
        browserIsChrome: () => isChrome,
    })

    return { notificationsAPI, creator }
}

describe('Notifications system tests', () => {
    it('should filter out extra create notification args on Firefox', async () => {
        const { creator, notificationsAPI } = setupTest({ isChrome: false })

        expect(notificationsAPI.notif).toBe(undefined)
        await creator.create(NOTIF_1 as any)
        expect(notificationsAPI.notif).not.toEqual(NOTIF_1)
        expect(notificationsAPI.notif).toEqual(NOTIF_1_FF)
    })

    it('should not filter out extra create notification args on Chrome', async () => {
        const { creator, notificationsAPI } = setupTest({ isChrome: true })

        expect(notificationsAPI.notif).toBe(undefined)
        await creator.create(NOTIF_1 as any)
        expect(notificationsAPI.notif).toEqual(NOTIF_1)
        expect(notificationsAPI.notif).not.toEqual(NOTIF_1_FF)
    })
})
