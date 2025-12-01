import inMemoryDb from '@worldbrain/storex-backend-dexie/ts/in-memory'

import initStorex from './storex'

export default () =>
    initStorex({
        dbName: 'test',
        idbImplementation: inMemoryDb(),
    })
