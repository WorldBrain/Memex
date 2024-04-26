import {
    DexieUtilsPlugin,
    SuggestPlugin,
    BackupPlugin,
} from 'src/search/plugins'
import { AnnotationsListPlugin } from 'src/search/background/annots-list'
import { StorageBackendPlugin } from '@worldbrain/storex'
import { DexieStorageBackend } from '@worldbrain/storex-backend-dexie'

export const createStorexPlugins = (): StorageBackendPlugin<
    DexieStorageBackend
>[] => [
    new BackupPlugin(),
    new AnnotationsListPlugin(),
    new SuggestPlugin(),
    new DexieUtilsPlugin(),
]
