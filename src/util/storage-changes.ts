import { browser, Storage } from 'webextension-polyfill-ts'

export interface StorageChanges {
    [key: string]: Storage.StorageChange
}

export type StorageAreaName = 'sync' | 'local' | 'managed'
export type StorageKeyListener = (vals: Storage.StorageChange) => void

export class StorageChangesManager {
    private listeners: Map<StorageAreaName, Map<string, StorageKeyListener>>

    constructor() {
        this.resetListeners()

        browser.storage.onChanged.addListener(this.handleChanges)
    }

    /**
     * Set up state for individual storage change listeners.
     */
    public resetListeners() {
        this.listeners = new Map<
            StorageAreaName,
            Map<string, StorageKeyListener>
        >([['sync', new Map()], ['local', new Map()], ['managed', new Map()]])
    }

    /**
     * Master event listener; delegates control to appropriate internal storage key listeners
     * based on the changes made.
     */
    private handleChanges = (
        changes: StorageChanges,
        areaName: StorageAreaName,
    ) => {
        const storageAreaHandlers = this.listeners.get(areaName)

        // Exit early when no listeners
        if (!storageAreaHandlers.size) {
            return
        }

        // For each of the changes, run any listeners for those particular storage keys
        for (const [storageKey, values] of Object.entries(changes)) {
            const handler = storageAreaHandlers.get(storageKey)

            if (handler != null) {
                handler(values)
            }
        }
    }

    /**
     * Affords scheduling of new storage key listeners for specific storage areas.
     */
    public addListener = (
        areaName: StorageAreaName,
        storageKey: string,
        listener: StorageKeyListener,
    ) => this.listeners.get(areaName).set(storageKey, listener)
}

const storageChangesManager = new StorageChangesManager()

export { storageChangesManager }
