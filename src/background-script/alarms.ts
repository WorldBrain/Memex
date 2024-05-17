import type { Alarms } from 'webextension-polyfill'

export type AlarmJob = {
    /** Can be null if the alarm job is to be scheduled dynamically. */
    alarmDefinition: Alarms.CreateAlarmInfoType | null
    job: () => Promise<void>
}

export function setupAlarms(
    alarmsAPI: Alarms.Static,
    jobs: { [name: string]: AlarmJob },
) {
    for (let [name, { alarmDefinition }] of Object.entries(jobs)) {
        if (alarmDefinition) {
            alarmsAPI.create(name, alarmDefinition)
        }
    }
    alarmsAPI.onAlarm.addListener(async ({ name }) => {
        if (name in jobs) {
            await jobs[name].job()
        }
    })
}
