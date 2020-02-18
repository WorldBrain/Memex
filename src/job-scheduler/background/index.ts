import { JobScheduler, Props as JobSchedulerProps } from './job-scheduler'
import { JobDefinition, JobProps } from './types'

export interface Props extends JobSchedulerProps, JobProps {
    jobs?: JobDefinition[]
}

export default class JobSchedulerBackground {
    scheduler: JobScheduler

    static defaultProps: Partial<Props> = {
        jobs: [],
    }

    constructor(private props: Props) {
        this.scheduler = new JobScheduler(props)
    }

    async setup() {
        for (const job of this.props.jobs) {
            await this.scheduler.scheduleJob({
                ...job,
                job: job.job.bind(job, this.props),
            })
        }
    }
}
