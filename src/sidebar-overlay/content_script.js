import { injectCSS } from 'src/search-injection/dom'
import { setupRibbonUI } from './components'

export function loader(promiseCreator) {
    let promise

    return (...args) => {
        if (!promise) {
            promise = promiseCreator(...args).then(res => {
                promise.loaded = true
                return res
            })
        }

        return promise
    }
}

export const bodyLoader = loader(() => {
    return new Promise(resolve => {
        if (
            document.readyState === 'complete' ||
            document.readyState === 'interactive'
        ) {
            return resolve()
        }

        document.addEventListener('DOMContentLoaded', resolve)
    })
})

const init = async () => {
    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-annotations-ribbon')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('content_script.css')
    injectCSS(cssFile)

    setupRibbonUI(target)
}

init()
