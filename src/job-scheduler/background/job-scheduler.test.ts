import { Alarms } from 'webextension-polyfill-ts'

import { JobScheduler } from './job-scheduler'
import { JobDefinition, PrimedJob } from './types'

class MockAlarmsApi {
    listener: (alarm: Alarms.Alarm, now?: number) => Promise<void>
    alarms: Map<string, Alarms.CreateAlarmInfoType> = new Map()

    onAlarm = {
        addListener: (listener) => (this.listener = listener),
    }

    create(name: string, info: Alarms.CreateAlarmInfoType) {
        this.alarms.set(name, info)
    }
}

class MockStorageApi {
    values: Map<string, any> = new Map()

    local = {
        set: (dict) => {
            const [[key, value]] = Object.entries(dict)
            this.values.set(key, value)
        },
        get: (dict) => {
            const [[key, def]] = Object.entries(dict)
            return { [key]: this.values.get(key) || def }
        },
    }
}

async function setupTest() {
    const alarmsAPI = new MockAlarmsApi()
    const storageAPI = new MockStorageApi()
    const scheduler = new JobScheduler({
        alarmsAPI: alarmsAPI as any,
        storageAPI: storageAPI as any,
        storagePrefix: '',
    })

    return { scheduler, alarmsAPI, storageAPI }
}

describe('JobScheduler tests', () => {
    it('should be able to schedule and run periodic jobs', async () => {
        const { scheduler, alarmsAPI, storageAPI } = await setupTest()

        let timesRun = 0
        const testJob: JobDefinition<PrimedJob> = {
            name: 'test-1',
            periodInMinutes: 1,
            job: () => {
                timesRun += 1
            },
        }

        expect(scheduler['jobs'].get(testJob.name)).toBeUndefined()
        expect(
            await storageAPI.local.get({
                [testJob.name]: JobScheduler.NOT_SET,
            }),
        ).toEqual({
            [testJob.name]: JobScheduler.NOT_SET,
        })

        await scheduler.scheduleJobHourly(testJob)

        expect(scheduler['jobs'].get(testJob.name)).toEqual(testJob)
        expect(
            await storageAPI.local.get({
                [testJob.name]: JobScheduler.NOT_SET,
            }),
        ).toEqual({
            [testJob.name]: expect.any(Number),
        })

        expect(timesRun).toBe(0)

        const now = Date.now()
        for (const i of [1, 2, 3, 4, 5]) {
            await alarmsAPI.listener(
                { name: testJob.name } as any,
                now + testJob.periodInMinutes * i * 60 * 1000 + 500,
            )

            expect(timesRun).toBe(i)
        }
    })

    it('should be able to schedule and run one-off jobs', async () => {
        const { scheduler, alarmsAPI, storageAPI } = await setupTest()

        let timesRun = 0
        const testJob: JobDefinition<PrimedJob> = {
            name: 'test-1',
            delayInMinutes: 1,
            job: () => {
                timesRun += 1
            },
        }

        expect(scheduler['jobs'].get(testJob.name)).toBeUndefined()
        expect(
            await storageAPI.local.get({
                [testJob.name]: JobScheduler.NOT_SET,
            }),
        ).toEqual({
            [testJob.name]: JobScheduler.NOT_SET,
        })

        await scheduler.scheduleJobHourly(testJob)

        expect(scheduler['jobs'].get(testJob.name)).toEqual(testJob)
        expect(
            await storageAPI.local.get({
                [testJob.name]: JobScheduler.NOT_SET,
            }),
        ).toEqual({
            [testJob.name]: expect.any(Number),
        })

        expect(timesRun).toBe(0)

        const now = Date.now()
        for (const i of [1, 2, 3, 4, 5]) {
            await alarmsAPI.listener(
                { name: testJob.name } as any,
                now + testJob.delayInMinutes * i * 60 * 1000 + 500,
            )

            expect(
                await storageAPI.local.get({
                    [testJob.name]: JobScheduler.NOT_SET,
                }),
            ).toEqual({
                [testJob.name]: JobScheduler.ALREADY_RUN,
            })

            expect(timesRun).toBe(1)
        }
    })
})
