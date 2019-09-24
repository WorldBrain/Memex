import inMemoryDb from '@worldbrain/storex-backend-dexie/lib/in-memory'

import initStorex from './storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'

export default (options?: { customMiddleware?: StorageMiddleware[] }) =>
    initStorex({
        dbName: 'test',
        idbImplementation: inMemoryDb(),
        customMiddleware: options && options.customMiddleware,
    })
