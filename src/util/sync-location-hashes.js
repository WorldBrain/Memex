// Watches for hash-changes on the given windows (i.e. frames), updating the
// others whenever one of them changes.
//
// Parameters:
// - windows: an Array of Windows.
// - initial (optional): the window whose hash is used to sync them initially.
// Returns a function that disables synchronisation again.
export default function syncLocationHashes(windows, {initial}) {
    const listeners = windows.map(win => function syncHashListener() {
        syncHashToOthers(win)
    })

    function syncHashToOthers(win) {
        // Read the window's hash, dropping the '#' if present.
        let hash = win.location.hash
        if (hash.startsWith('#')) {
            hash = hash.substring(1)
        }
        // Likewise read each other window's hash, and update them where needed.
        windows.forEach(otherWindow => {
            if (otherWindow !== win) {
                let otherHash = otherWindow.location.hash
                if (otherHash.startsWith('#')) {
                    otherHash = otherHash.substring(1)
                }
                if (otherHash !== hash) {
                    otherWindow.location.hash = hash
                }
            }
        })
    }

    function enableAllListeners() {
        windows.forEach((win, i) => {
            win.addEventListener('hashchange', listeners[i])
        })
    }

    function disableAllListeners() {
        windows.forEach((win, i) => {
            win.removeEventListener('hashchange', listeners[i])
        })
    }

    if (initial !== undefined) {
        syncHashToOthers(initial)
    }

    enableAllListeners()

    return disableAllListeners
}
