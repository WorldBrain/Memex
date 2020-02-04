import StorageManager from '@worldbrain/storex'
import { DexieUtilsPlugin } from 'src/search/plugins'

export const dangerousPleaseBeSureDeleteAndRecreateDatabase = async (
    storageManager: StorageManager,
) => {
    return storageManager.operation(DexieUtilsPlugin.NUKE_DB_OP)
}
