import { injectCSS } from 'src/search-injection/dom'
import { setupRibbonUI } from './components'
import { bodyLoader } from 'src/util/loader'
import { highlightAndScroll } from './utils'
import { setUpRemoteFunctions } from './messaging'
import { getLocalStorage } from 'src/util/storage'
import { TOOLTIP_STORAGE_NAME } from 'src/content-tooltip/constants'

const init = async () => {
    const isTooltipEnabled = await getLocalStorage(TOOLTIP_STORAGE_NAME)
    if (!isTooltipEnabled) return

    await bodyLoader()

    const target = document.createElement('div')
    target.setAttribute('id', 'memex-annotations-ribbon')
    document.body.appendChild(target)

    const cssFile = browser.extension.getURL('content_script.css')
    injectCSS(cssFile)

    setUpRemoteFunctions({
        highlightAndScroll: (annotation, ...args) =>
            highlightAndScroll(annotation),
    })

    setupRibbonUI(target)
}

init()
