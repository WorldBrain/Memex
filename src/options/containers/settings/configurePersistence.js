import { actions } from '../../blacklist'

export default function configurePersistence(store) {
    // Subscribe to changes and update local storage
    store.subscribe(() => {
        const { blacklist } = store.getState().blacklist
        chrome.storage.local.set({'blacklist': JSON.stringify(blacklist)})
    })

    // Rehydrate blacklist on init from localStorage
    chrome.storage.local.get('blacklist', data => {
        if(!data.blacklist)
            return

        const blacklist = JSON.parse(data.blacklist)
        store.dispatch(actions.setBlacklist(blacklist))
    })
}
