import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import ConnHandler from './import-connection-handler'
import importStateManager from './import-state'
import { IMPORT_CONN_NAME as MAIN_CONN } from 'src/options/imports/constants'
import { IMPORT_CONN_NAME as ONBOARDING_CONN } from 'src/overview/onboarding/constants'

// Constants
export const importStateStorageKey = 'import_items'
export const installTimeStorageKey = 'extension_install_time'

// Allow UI scripts to dirty estimates cache
makeRemotelyCallable({ dirtyEstsCache: () => importStateManager.dirtyEsts() })

// Allow content-script or UI to connect and communicate control of imports
browser.runtime.onConnect.addListener(port => {
    // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
    switch (port.name) {
        case MAIN_CONN:
            return new ConnHandler({ port })
        case ONBOARDING_CONN:
            return new ConnHandler({ port, quick: true })
        default:
    }
})
