const wrtc = require('wrtc')
import StorageManager from '@worldbrain/storex'
import { TypeORMStorageBackend } from '@worldbrain/storex-backend-typeorm'
import { extractUrlParts, normalizeUrl } from '@worldbrain/memex-url-utils'
import { MetaPickerStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/meta-picker/storage'
import { OverviewStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/overview/storage'
import { PageEditorStorage } from '@worldbrain/memex-storage/lib/mobile-app/features/page-editor/storage'
import { registerModuleMapCollections } from '@worldbrain/storex-pattern-modules'
import SyncBackground from 'src/sync/background'
import MemoryBrowserStorage from 'src/util/tests/browser-storage'
import { SignalTransportFactory } from '@worldbrain/memex-common/lib/sync'
import { SharedSyncLog } from '@worldbrain/storex-sync/lib/shared-sync-log'
import { MemoryAuthService } from '@worldbrain/memex-common/lib/authentication/memory'
import { MemorySubscriptionsService } from '@worldbrain/memex-common/lib/subscriptions/memory'
import { AuthBackground } from 'src/authentication/background'

export interface MobileIntegrationTestSetup {
    storage: {
        manager: StorageManager
        modules: {
            metaPicker: MetaPickerStorage
            overview: OverviewStorage
            pageEditor: PageEditorStorage
        }
    }
    services: {
        sync: SyncBackground
    }
    destroy: () => Promise<void>
}

let storageBackendsCreated = 0

export async function setupMobileIntegrationTest(options?: {
    signalTransportFactory?: SignalTransportFactory
    sharedSyncLog?: SharedSyncLog
    browserLocalStorage?: MemoryBrowserStorage
}): Promise<MobileIntegrationTestSetup> {
    const browserLocalStorage =
        (options && options.browserLocalStorage) || new MemoryBrowserStorage()

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

    const authService = new MemoryAuthService()
    // const subscriptionService = new MemorySubscriptionsService()
    // const auth: AuthBackground = new AuthBackground({
    //     authService,
    //     subscriptionService,
    // })

    const sync = new SyncBackground({
        auth: authService,
        storageManager,
        signalTransportFactory: options && options.signalTransportFactory,
        getSharedSyncLog: async () => options && options.sharedSyncLog,
        browserAPIs: {
            storage: { local: browserLocalStorage } as any,
        },
        appVersion: '1.2.3',
    })
    sync.initialSync.wrtc = wrtc
    registerModuleMapCollections(storageManager.registry, {
        ...storageModules,
        clientSyncLog: sync.clientSyncLog,
        syncInfo: sync.syncInfoStorage,
    })
    await storageManager.finishInitialization()
    await storageManager.backend.migrate()

    return {
        storage: {
            manager: storageManager,
            modules: storageModules,
        },
        services: {
            sync,
        },
        destroy: async () => {
            if (backend.connection) {
                await backend.connection.close()
            }
        },
    }
}
