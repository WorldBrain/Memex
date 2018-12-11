import * as expect from 'expect'
import Storex from 'storex'
import { DexieStorageBackend } from 'storex-backend-dexie'
import inMemory from 'storex-backend-dexie/lib/in-memory'

import { StorageManager } from '../../search/types'
import setupChangeTracking from './change-hooks'

describe('Backup change hooks', () => {
    it('should trigger the registered hooks when updating a table', async () => {
        const storageBackend = new DexieStorageBackend({
            dbName: 'my-awesome-product',
            idbImplementation: inMemory(),
        })
        const storageManager = new Storex({
            backend: storageBackend,
        }) as StorageManager
        storageManager.registry.registerCollections({
            user: {
                version: new Date(2018, 11, 11),
                fields: {
                    displayName: { type: 'string' },
                },
                indices: [],
            },
        })
        await storageManager.finishInitialization()

        const changes = []
        setupChangeTracking(storageManager, change => {
            changes.push(change)
        })

        await storageManager
            .collection('user')
            .createObject({ id: 1, displayName: 'Joe' })
        expect(changes).toEqual([
            { pk: 1, collection: 'user', operation: 'create' },
        ])
    })
})
