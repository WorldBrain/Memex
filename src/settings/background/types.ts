import type { LimitedBrowserStorage } from 'src/util/tests/browser-storage'

export type SettingValue =
    | string
    | number
    | string[]
    | number[]
    | { [key: string]: any }

export interface Setting {
    name: string
    value: SettingValue
}

export interface RemoteSettingsInterface extends LimitedBrowserStorage {}
