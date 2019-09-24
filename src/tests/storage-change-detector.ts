import { detailedDiff } from 'deep-object-diff'
import StorageManager from '@worldbrain/storex'
import { getObjectPk } from '@worldbrain/storex-sync/lib/utils'

export interface StorageDiff {
    [collection: string]: StorageCollectionDiff
}

export interface StorageCollectionDiff {
    [pk: string]: StorageDiffEntry
}

export type StorageDiffEntry =
    | StorageDiffCreationEntry
    | StorageDiffModificationEntry
    | StorageDiffDeletionEntry

export interface StorageDiffEntryBase { }

export interface StorageDiffCreationEntry extends StorageDiffEntryBase {
    type: 'create'
    object: { [key: string]: any }
}

export interface StorageDiffModificationEntry extends StorageDiffEntryBase {
    type: 'modify'
    updates: { [key: string]: any }
}
export interface StorageDiffDeletionEntry extends StorageDiffEntryBase {
    type: 'delete'
}

interface StorageState {
    [collection: string]: { [pk: string]: any }
}
export class StorageChangeDetector {
    private storageState: StorageState = {}

    constructor(
        private options: { storageManager: StorageManager; toTrack: string[] },
    ) { }

    async capture() {
        this.storageState = await this._getState()
    }

    async compare(): Promise<StorageDiff> {
        const oldState = this.storageState
        const newState = await this._getState()
        const objectDiff = detailedDiff(oldState, newState)
        this.storageState = newState

        const storageDiff: StorageDiff = {}
        const getCollectionDiff = (collectionName: string) => {
            let collectionDiff = storageDiff[collectionName]
            if (!collectionDiff) {
                storageDiff[collectionName] = collectionDiff = {}
            }
            return collectionDiff
        }

        for (const [collectionName, addedToCollection] of Object.entries(
            objectDiff['added'] || {},
        )) {
            const collectionDiff = getCollectionDiff(collectionName)
            for (const [objectPk, updates] of Object.entries(
                addedToCollection,
            )) {
                if (!oldState[collectionName][objectPk]) {
                    collectionDiff[this._getObjectKey(objectPk)] = {
                        type: 'create',
                        object: updates,
                    }
                } else {
                    collectionDiff[this._getObjectKey(objectPk)] = {
                        type: 'modify',
                        updates,
                    }
                }
            }
        }
        for (const [collectionName, updatedInCollection] of Object.entries(
            objectDiff['updated'] || {},
        )) {
            const collectionDiff = getCollectionDiff(collectionName)
            for (const [objectPk, updates] of Object.entries(
                updatedInCollection,
            )) {
                collectionDiff[this._getObjectKey(objectPk)] = {
                    type: 'modify',
                    updates,
                }
            }
        }
        for (const [collectionName, deletedInCollection] of Object.entries(
            objectDiff['deleted'] || {},
        )) {
            const collectionDiff = getCollectionDiff(collectionName)
            for (const [objectPk, deletions] of Object.entries(
                deletedInCollection,
            )) {
                if (typeof deletions === 'undefined') {
                    collectionDiff[this._getObjectKey(objectPk)] = {
                        type: 'delete',
                    }
                } else {
                    throw new Error(
                        'Detection deletions of things inside objects not implemented yet',
                    )
                }
            }
        }
        return storageDiff
    }

    _getObjectKey(objectPk: any) {
        if (objectPk instanceof Array) {
            return JSON.stringify(objectPk)
        } else {
            return objectPk
        }
    }

    async _getState(): Promise<StorageState> {
        const state: StorageState = {}
        for (const collectionName of this.options.toTrack) {
            const objects = await this.options.storageManager
                .collection(collectionName)
                .findObjects({})

            const collectiobObjects: { [pk: string]: any } = {}
            for (const object of objects) {
                const pk = getObjectPk(
                    object,
                    collectionName,
                    this.options.storageManager.registry,
                )
                collectiobObjects[this._getObjectKey(pk)] = object
            }
            state[collectionName] = collectiobObjects
        }
        return state
    }
}
