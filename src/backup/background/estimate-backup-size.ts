import { StorageManager } from '../../search/storage/manager'

export interface SizeEst {
    bytesWithBlobs: number
    bytesWithoutBlobs: number
}

const estimateBackupSize = ({
    storageManager,
    indexedDB = window.indexedDB,
    dbName = 'memex',
}: {
    storageManager: StorageManager
    indexedDB?: IDBFactory
    dbName?: string
}) =>
    new Promise<SizeEst>((resolve, reject) => {
        let totalSize: SizeEst = {
            bytesWithBlobs: 0,
            bytesWithoutBlobs: 0,
        }

        const storeNames = deriveStoreNames(storageManager)
        const req = indexedDB.open(dbName)

        req.onsuccess = async function() {
            const db = this.result

            for (const store of storeNames) {
                const storeSize = await calcStoreSize(db, store)
                totalSize = sumSizeEsts(totalSize, storeSize)
            }

            resolve(totalSize)
        }

        req.onerror = function() {
            reject(this.error)
        }
    })

const calcStoreSize = (db: IDBDatabase, storeName: string) =>
    new Promise<SizeEst>((resolve, reject) => {
        let storeSize: SizeEst = {
            bytesWithBlobs: 0,
            bytesWithoutBlobs: 0,
        }

        const cursorReq = db
            .transaction(storeName, 'readonly')
            .objectStore(storeName)
            .openCursor()

        cursorReq.onsuccess = function() {
            const cursor = this.result as IDBCursor

            // Cursor exhausted
            if (!cursor) {
                return resolve(storeSize)
            }

            const obj = cursor['value'] // Somehow `value` prop doesn't exist in the typedef :S
            const objSize = calcObjectSize(storeName, obj)
            storeSize = sumSizeEsts(storeSize, objSize)
            cursor.continue()
        }

        cursorReq.onerror = function() {
            reject(this.error)
        }
    })

function calcObjectSize(storeName: string, obj): SizeEst {
    if (storeName === 'pages' && obj.screenshot != null) {
        const { screenshot, ...rest } = obj
        const bytesWithoutBlobs = JSON.stringify(rest).length
        const bytesWithBlobs = bytesWithoutBlobs + (screenshot as Blob).size

        return { bytesWithBlobs, bytesWithoutBlobs }
    }

    if (storeName === 'favIcons' && obj.favIcon != null) {
        const { favIcon, ...rest } = obj
        const size = JSON.stringify(rest).length + (favIcon as Blob).size
        return { bytesWithBlobs: size, bytesWithoutBlobs: size }
    }

    const bytes = JSON.stringify(obj).length
    return { bytesWithBlobs: bytes, bytesWithoutBlobs: bytes }
}

const deriveStoreNames = ({ registry }: StorageManager) =>
    Object.entries(registry.collections)
        .filter(([, def]) => def.backup !== false)
        .map(([name]) => name)

const sumSizeEsts = (a: SizeEst, b: SizeEst): SizeEst => ({
    bytesWithBlobs: a.bytesWithBlobs + b.bytesWithBlobs,
    bytesWithoutBlobs: a.bytesWithoutBlobs + b.bytesWithoutBlobs,
})

export default estimateBackupSize
