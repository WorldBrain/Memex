import { idleManager } from '../../util/idle'
import { MigrationManager } from './migration-manager'
import searchIndex from '../'
import analytics from '../../analytics'

const migrator = new MigrationManager({
    onComplete() {
        // Update global setting to force switch to using new index for all interface methods
        searchIndex.useOld = false
        analytics.trackEvent({ category: 'Migration', action: 'Completed' })
    },
})

// Schedule migrator to run when browser is idle (only if old index is still in use)
searchIndex.dataReady.then(() => {
    if (searchIndex.useOld) {
        idleManager.scheduleIdleCbs({
            onIdle: () => migrator.start(),
            onActive: () => migrator.stop(),
        })
    }
})

export * from './types'
export { MigrationManager }
