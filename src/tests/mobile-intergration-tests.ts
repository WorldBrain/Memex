import { TypeORMStorageBackend } from '@worldbrain/storex-backend-typeorm'
import StorageManager from '@worldbrain/storex'
import { extractUrlParts, normalizeUrl } from '@worldbrain/memex-url-utils'
import { MetaPickerStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/storage'
import { OverviewStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/storage'
import { PageEditorStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/page-editor/storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'

let storageBackendsCreated = 0

export async function setupMobileIntegrationTest() {
    const backend = new TypeORMStorageBackend({
        connectionOptions: {
            type: 'sqlite',
            database: ':memory:',
            name: `connection-${++storageBackendsCreated}`,
        },
        // connectionOptions: { type: 'sqlite', database: ':memory:', logging: true },
        // connectionOptions: { type: 'sqlite', database: '/tmp/test.sqlite', logging: true },
    })

    const storageManager = new StorageManager({ backend })
    const storageModules = {
        metaPicker: new MetaPickerStorage({ storageManager }),
        overview: new OverviewStorage({
            storageManager,
            extractUrlParts,
            normalizeUrl,
        }),
        pageEditor: new PageEditorStorage({ storageManager, normalizeUrl }),
    }
    registerModuleMapCollections(storageManager.registry, storageModules)
    await storageManager.finishInitialization()

    return {
        storage: {
            manager: storageManager,
            modules: storageModules,
        },
        destroy: async () => {
            if (backend.connection) {
                await backend.connection.close()
            }
        },
    }
}
