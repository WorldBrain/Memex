export type AlarmJob = {
    /** Can be null if the alarm job is to be scheduled dynamically. */
    alarmDefinition: typeof chrome.alarms | null
    job: () => Promise<void>
}

export function setupAlarms(
    alarmsAPI: typeof chrome.alarms,
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
