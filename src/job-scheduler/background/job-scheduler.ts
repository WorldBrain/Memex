import { Alarms, Storage } from 'webextension-polyfill-ts'

import { JobDefinition, PrimedJob } from './types'
import { SCHEDULES } from '../constants'
import { isDev } from 'src/analytics/internal/constants'

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
        typeof minutes === 'undefined' ? minutes : now + minutes * 60 * 1000

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

    private async initJobTimeoutStatus(
        name: string,
        reInit = false,
        now: number = Date.now(),
    ) {
        const job = this.jobs.get(name)
        const timeToRun = await this.getTimeoutKey(name)

        if (timeToRun !== JobScheduler.ALREADY_RUN || reInit) {
            await this.setTimeoutKey(
                name,
                job.when ??
                    JobScheduler.calcTimeFromNow(job.periodInMinutes, now) ??
                    JobScheduler.calcTimeFromNow(job.delayInMinutes, now),
            )
        }
    }

    private async attemptPeriodicJob(
        { name, periodInMinutes, job }: JobDefinition<PrimedJob>,
        now: number,
    ) {
        const timeToRun = await this.getTimeoutKey(name)

        if (timeToRun < now) {
            await job()
            await this.setTimeoutKey(
                name,
                JobScheduler.calcTimeFromNow(periodInMinutes),
            )
        }
    }

    private async attemptOneOffJob(
        { name, job }: JobDefinition<PrimedJob>,
        now: number,
    ) {
        const timeToRun = await this.getTimeoutKey(name)

        if (timeToRun === JobScheduler.ALREADY_RUN) {
            return
        } else if (timeToRun <= now) {
            const result = await job()
            await this.setTimeoutKey(name, JobScheduler.ALREADY_RUN)
            return result
        }
    }

    private handleAlarm = async ({ name }: Alarms.Alarm, now = Date.now()) => {
        const job = this.jobs.get(name)
        if (!job) {
            console['warn']([
                `Tried to fire an alarm but no job was found with name: ${name}`,
            ])
            return
        }

        if (job.delayInMinutes || job.when) {
            return this.attemptOneOffJob(job, now)
        } else if (job.periodInMinutes) {
            return this.attemptPeriodicJob(job, now)
        } else {
            console['warn']([
                `Tried to fire an alarm but the type of job could not be determined for name: ${name}`,
            ])
        }
    }

    // Schedule all periodic ping attempts at a random minute past the hour, every hour
    async scheduleJobHourly(job: JobDefinition<PrimedJob>) {
        this.jobs.set(job.name, job)

        const jobDef = {
            // fire the initial alarm in a random minute,
            // this will ensure all of the created alarms fire at different time of the hour
            delayInMinutes: Math.floor(Math.random() * 60),
            periodInMinutes: SCHEDULES.EVERY_HOUR,
        }
        this.props.alarmsAPI.create(job.name, jobDef)
        await this.initJobTimeoutStatus(job.name)
    }

    async scheduleJobOnce(job: JobDefinition<PrimedJob>) {
        const oldJob = this.jobs.get(job.name)

        if (oldJob && oldJob.when && oldJob.when === job.when) {
            return
        }

        this.jobs.set(job.name, job)
        await this.initJobTimeoutStatus(job.name, true)

        this.props.alarmsAPI.create(job.name, {
            when: job.when,
        })
    }
}
