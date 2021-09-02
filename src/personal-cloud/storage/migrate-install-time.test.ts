import { makeSingleDeviceUILogicTestFactory } from 'src/tests/ui-logic-tests'
import { migrateInstallTime } from './migrate-install-time'

describe('derive install time from visits tests', () => {
    const it = makeSingleDeviceUILogicTestFactory()

    it('should set the oldest visit timestamp from the DB if invalid time stored previously', async ({
        device,
    }) => {
        let newInstallTime: number
        const storageManager = device.storageManager
        const numVisits = 100
        const baseTimestamp = Date.now()

        for (let i = 0; i <= numVisits; i++) {
            await storageManager.collection('visits').createObject({
                time: baseTimestamp - i,
                url: 'getmemex.com',
            })
        }

        expect(newInstallTime).toBeUndefined()
        await migrateInstallTime({
            storageManager,
            getOldInstallTime: async () => null,
            setInstallTime: async (time) => {
                newInstallTime = time
            },
        })
        expect(newInstallTime).toBe(baseTimestamp - numVisits)
    })

    it(`should use previously stored install time if it's valid`, async ({
        device,
    }) => {
        let newInstallTime: number
        const storageManager = device.storageManager
        const numVisits = 100
        const baseTimestamp = Date.now()

        for (let i = 0; i <= numVisits; i++) {
            await storageManager.collection('visits').createObject({
                time: baseTimestamp - i,
                url: 'getmemex.com',
            })
        }

        const laterTimestamp = Date.now()

        expect(newInstallTime).toBeUndefined()
        await migrateInstallTime({
            storageManager,
            getOldInstallTime: async () => laterTimestamp,
            setInstallTime: async (time) => {
                newInstallTime = time
            },
        })
        expect(newInstallTime).toBe(laterTimestamp)
    })

    it('should fallback to now if no visits or prev stored install time', async ({
        device,
    }) => {
        let newInstallTime: number
        const storageManager = device.storageManager
        const fallbackNow = Date.now()

        expect(newInstallTime).toBeUndefined()
        await migrateInstallTime({
            storageManager,
            getOldInstallTime: async () => null,
            setInstallTime: async (time) => {
                newInstallTime = time
            },
            fallbackNow,
        })
        expect(newInstallTime).toBe(fallbackNow)
    })
})
