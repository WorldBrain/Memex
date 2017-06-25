// Watches for hash-changes on the given windows (i.e. frames), updating the
// others whenever one of them changes.
//
// Parameters:
// - windows: an Array of Windows.
// - initial (optional): the window whose hash is used to sync them initially.
// Returns a function that disables synchronisation again.
export default function syncLocationHashes(windows, {initial}) {
    const listeners = windows.map(win => function syncHashListener() {
        disableAllListeners()
        syncHashToOthers(win)
        enableAllListeners()
    })

    function syncHashToOthers(win) {
        const hash = win.location.hash
        windows.forEach(otherWindow => {
            if (otherWindow !== win) {
                otherWindow.location.hash = hash
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
