import { injectCSS } from 'src/search-injection/dom'

const CONTAINER_CLASS = 'memex-tooltip-notification'

export function createRootElement() {
    const container = document.createElement('div')
    container.classList.add(CONTAINER_CLASS)

    const cssFile = window['browser'].extension.getURL('/content_script.css')
    const rootElement = document.createElement('div')
    if (container.attachShadow) {
        const shadow = container.attachShadow({ mode: 'closed' })
        shadow.appendChild(rootElement)
        injectCSS(cssFile, shadow)
    } else {
        container.appendChild(rootElement)
        injectCSS(cssFile)
    }
    document.body.appendChild(container)

    return rootElement
}

export function destroyRootElement() {
    const container = document.querySelector(`.${CONTAINER_CLASS}`)
    if (container) {
        container.remove()
    }
}
