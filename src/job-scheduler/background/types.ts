import NotificationBackground from 'src/notifications/background'

export type Job = (props: JobProps) => Promise<void> | void
export type PrimedJob = () => Promise<void> | void

export interface JobDefinition<T = Job | PrimedJob> {
    job: T
    name: string
    periodInMinutes?: number
    delayInMinutes?: number
}

export interface JobProps {
    notifications: NotificationBackground
}
