import { makeRemotelyCallable } from 'src/util/webextensionRPC'
import ConnHandler from './connection-handler'
import getImportStateManager from './state-manager'
import { IMPORT_CONN_NAME as MAIN_CONN } from 'src/options/imports/constants'
import { SearchIndex } from 'src/search'
import { browser } from 'webextension-polyfill-ts'
import TagsBackground from 'src/tags/background'
import CustomListBackground from 'src/custom-lists/background'

// Constants
export const importStateStorageKey = 'import_items'

export function setupImportBackgroundModule(options: {
    searchIndex: SearchIndex
    tagsModule: TagsBackground
    customListsModule: CustomListBackground
}) {
    // Allow UI scripts to dirty estimates cache
    makeRemotelyCallable({
        dirtyEstsCache: () => getImportStateManager().dirtyEstsCache(),
    })

    // Allow content-script or UI to connect and communicate control of imports
    browser.runtime.onConnect.addListener(port => {
        // Make sure to only handle connection logic for imports (allows other use of runtime.connect)
        if (port.name === MAIN_CONN) {
            return new ConnHandler({ port, ...options })
        }
    })
}
