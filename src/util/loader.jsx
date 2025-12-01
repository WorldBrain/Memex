import { InPageUIBackground } from 'src/in-page-ui/background/index'

// For things that must only happen once
export function loader(promiseCreator) {
    let promise

    return (...args) => {
        if (!promise) {
            promise = promiseCreator(...args).then((res) => {
                promise.loaded = true
                return res
            })
        }

        return promise
    }
}

export function injectYoutubeContextMenu() {
    const config = { attributes: true, childList: true, subtree: true }
    const observer = new MutationObserver((mutation) => {
        if (mutation[0].target.className === 'ytp-popup ytp-contextmenu') {
            const panel = document.getElementsByClassName('ytp-panel-menu')[1]
            const newEntry = document.createElement('div')
            const highlightRenderer = new InPageUIBackground()
            newEntry.setAttribute('class', 'ytp-menuitem')
            newEntry.onclick = function () {
                highlightRenderer.showSidebar()
            }
            newEntry.innerHTML =
                '<div class="ytp-menuitem-icon"></div><div class="ytp-menuitem-label">Add Note to timestamp with Memex</div>'
            panel.prepend(newEntry)
            panel.style.height = '320px'
            observer.disconnect()
        }
    })

    observer.observe(document, config)
}

export const bodyLoader = loader(() => {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            if (window.location.href.includes('youtube.com/watch?')) {
                injectYoutubeContextMenu()
            }

            return resolve()
        }

        window.addEventListener('load', () => {
            resolve()
        })
    })
})

export const interactiveLoader = loader(() => {
    return new Promise((resolve) => {
        if (document.readyState !== 'loading') {
            return resolve()
        }

        document.addEventListener('readystatechange', () => {
            if (document.readyState !== 'loading') {
                return resolve()
            }
        })
    })
})
