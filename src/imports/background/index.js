import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import ConnHandler from './connection-handler'
import getImportStateManager from './state-manager'
import { IMPORT_CONN_NAME as MAIN_CONN } from 'src/options/imports/constants'
import { IMPORT_CONN_NAME as ONBOARDING_CONN } from 'src/overview/onboarding/constants'

// Constants
export const importStateStorageKey = 'import_items'

// Allow UI scripts to dirty estimates cache
makeRemotelyCallable({
    dirtyEstsCache: () => getImportStateManager().dirtyEstsCache(),
})

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
