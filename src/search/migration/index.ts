import { MigrationManager } from './migration-manager'
import { makeRemotelyCallable } from '../../util/webextensionRPC'
import analytics from '../../analytics'

const migrator = new MigrationManager({
    onComplete() {
        // Update global setting to force switch to using new index for all interface methods
        // searchIndex.useOld = false
        analytics.trackEvent({ category: 'Migration', action: 'Completed' })
    },
})

let isRunning = false

// Allow migration to be started on-demand remotely
makeRemotelyCallable({
    startMigration: async () => {
        isRunning = true
        await migrator.start()
        MigrationManager.showNotif()
    },
    isMigrating: () => isRunning,
})

export * from './types'
export { MigrationManager }
