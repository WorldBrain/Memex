import { Alarms, Storage } from 'webextension-polyfill-ts'

import { JobDefinition, PrimedJob } from './types'
import { SCHEDULES } from '../constants'

export type Period = 'month' | 'week' | 'day'

export interface Props {
    storagePrefix?: string
    alarmsAPI: Alarms.Static
    storageAPI: Storage.Static
}

export class JobScheduler {
    static STORAGE_PREFIX = '@JobScheduler-'
    static NOT_SET = -1
    static ALREADY_RUN = -2

    private jobs: Map<string, JobDefinition<PrimedJob>> = new Map()

    static defaultProps: Partial<Props> = {
        storagePrefix: JobScheduler.STORAGE_PREFIX,
    }

    constructor(private props: Props) {
        props.alarmsAPI.onAlarm.addListener(this.handleAlarm)
    }

    private static calcTimeFromNow = (minutes: number, now = Date.now()) =>
        now + minutes * 60 * 1000

    private setTimeoutKey = (key: string, value: number) =>
        this.props.storageAPI.local.set({
            [this.props.storagePrefix + key]: value,
        })

    private getTimeoutKey = async (key: string): Promise<number> => {
        const {
            [this.props.storagePrefix + key]: timeToRun,
        } = await this.props.storageAPI.local.get({
            [this.props.storagePrefix + key]: JobScheduler.NOT_SET,
        })

        return timeToRun
    }

    private async attemptPeriodicJob(
        { name, periodInMinutes, job }: JobDefinition<PrimedJob>,
        now: number,
    ) {
        const timeToRun = await this.getTimeoutKey(name)

        if (timeToRun === JobScheduler.NOT_SET) {
            await this.setTimeoutKey(
                name,
                JobScheduler.calcTimeFromNow(periodInMinutes, now),
            )
        } else if (timeToRun < now) {
            await job()
            await this.setTimeoutKey(
                name,
                JobScheduler.calcTimeFromNow(periodInMinutes),
            )
        }
    }

    private async attemptOneOffJob(
        { name, delayInMinutes, job }: JobDefinition<PrimedJob>,
        now: number,
    ) {
        const timeToRun = await this.getTimeoutKey(name)

        if (timeToRun === JobScheduler.NOT_SET) {
            await this.setTimeoutKey(
                name,
                JobScheduler.calcTimeFromNow(delayInMinutes, now),
            )
        } else if (timeToRun === JobScheduler.ALREADY_RUN) {
            return
        } else if (timeToRun < now) {
            await job()
            await this.setTimeoutKey(name, JobScheduler.ALREADY_RUN)
        }
    }

    private handleAlarm = async ({ name }: Alarms.Alarm, now = Date.now()) => {
        const job = this.jobs.get(name)
        if (!job) {
            return
        }

        if (job.delayInMinutes) {
            return this.attemptOneOffJob(job, now)
        } else if (job.periodInMinutes) {
            return this.attemptPeriodicJob(job, now)
        }
    }

    // Schedule all periodic ping attempts at a random minute past the hour, every hour
    async scheduleJob(job: JobDefinition<PrimedJob>) {
        this.jobs.set(job.name, job)

        this.props.alarmsAPI.create(job.name, {
            // fire the initial alarm in a random minute,
            // this will ensure all of the created alarms fire at different time of the hour
            delayInMinutes: Math.floor(Math.random() * 60),
            periodInMinutes: SCHEDULES.EVERY_HOUR,
        })

        await this.handleAlarm({ name: job.name } as Alarms.Alarm)
    }
}
