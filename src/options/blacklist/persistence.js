import { setBlacklist } from './actions'

export default function configurePersistence(store) {
    store.subscribe(() => {
        const { blacklist } = store.getState().blacklist
        chrome.storage.local.set({ 'blacklist': JSON.stringify(blacklist) })
    })

    chrome.storage.local.get('blacklist', data => {
        if (!data.blacklist) return

        const blacklist = JSON.parse(data.blacklist)
        store.dispatch(setBlacklist(blacklist))
    })
}
