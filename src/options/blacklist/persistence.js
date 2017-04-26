import { setBlacklist } from './actions'
import { entireState } from './selectors'
import { STORAGE_KEY } from './constants'

export default function configurePersistence(store) {
    // Subscribe to changes and update local storage
    store.subscribe(() => {
        const { blacklist } = entireState(store.getState())
        chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(blacklist) })
    })

    // Rehydrate blacklist on init from localStorage
    chrome.storage.local.get(STORAGE_KEY, data => {
        if (!data.blacklist) return

        const blacklist = JSON.parse(data.blacklist)
        store.dispatch(setBlacklist(blacklist))
    })
}
