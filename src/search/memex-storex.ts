import initStorex from './storex'

export default () =>
    initStorex({
        dbName: 'memex',
        idbImplementation: {
            factory: self.indexedDB,
            range: self.IDBKeyRange,
        },
    })
