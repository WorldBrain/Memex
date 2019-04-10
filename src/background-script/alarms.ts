import { Alarms } from 'webextension-polyfill-ts'

export interface AlarmConfig extends Alarms.CreateAlarmInfoType {
    listener: () => void
}

export interface AlarmsConfig {
    [key: string]: AlarmConfig
}

export default {} as AlarmsConfig
