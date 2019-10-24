import { Browser } from 'webextension-polyfill-ts'

export interface LimitedBrowserStorage {
    set: Browser['storage']['local']['set']
    get: Browser['storage']['local']['get']
    remove: Browser['storage']['local']['remove']
}
type Primitive = number | string | boolean | null
type PrimitiveArray = Primitive[]
type EntryValue = Primitive | PrimitiveArray
interface EntryValueMap {
    [key: string]: EntryValue
}

export default class MemoryBrowserStorage implements LimitedBrowserStorage {
    private items = {}
    private changes = {}

    async set(changes: { [key: string]: EntryValue }) {
        for (const [key, value] of Object.entries(changes)) {
            this.changes[key] = value
            this.items[key] = value
        }
    }

    async get(
        wanted: string | string[] | EntryValueMap,
    ): Promise<EntryValueMap> {
        const maybe = (key: string) =>
            Object.keys(this.items).indexOf(key) >= 0
                ? { [key]: this.items[key] }
                : {}
        if (typeof wanted === 'string') {
            return maybe(wanted)
        } else if (wanted instanceof Array) {
            const result = {}
            for (const key of wanted) {
                Object.assign(result, maybe(key))
            }
            return result
        } else {
            const result = {}
            for (const [key, defaultValue] of Object.entries(wanted)) {
                Object.assign(result, maybe(key) || { [key]: defaultValue })
            }
            return result
        }
    }

    async remove(key: string) {
        this.changes[key] = undefined
        delete this.items[key]
    }

    popChanges() {
        const changes = this.changes
        this.changes = {}
        return changes
    }
}
