import Dexie from 'dexie'
import { StorageManager } from '../../search/types'

export type ChangeTracker = (
    args: { collection: string; pk: string; operation: string },
) => void

export default async function setupChangeTracking(
    { registry }: StorageManager,
    getDb: () => Promise<Dexie>,
    track: ChangeTracker,
) {
    const db = await getDb()

    for (const collection in registry.collections) {
        if (registry.collections[collection].watch === false) {
            continue
        }

        const table = db[collection]
        table.hook('creating', (pk, obj, transaction) => {
            track({
                operation: 'create',
                collection,
                pk,
            })
        })
        table.hook('updating', (mods, pk, obj, transaction) => {
            track({
                operation: 'update',
                collection,
                pk,
            })
        })
        table.hook('deleting', (pk, obj, transaction) => {
            track({
                operation: 'delete',
                collection,
                pk,
            })
        })
    }
}
