import inMemoryDb from '@worldbrain/storex-backend-dexie/lib/in-memory'

import initStorex from './storex'
import { StorageMiddleware } from '@worldbrain/storex/lib/types/middleware'

export default () =>
    initStorex({
        dbName: 'test',
        idbImplementation: inMemoryDb(),
    })
