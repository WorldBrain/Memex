import { injectCSS } from '../../search-injection/dom'

const CONTAINER_CLASS = 'memex-annotations-ribbon'

export function createRootElement() {
    const container = document.createElement('div')
    container.classList.add(CONTAINER_CLASS)
    container.setAttribute('id', 'memex-annotations-ribbon')

    const cssFile = window['browser'].extension.getURL('/content_script.css')
    const { rootElement, shadow } = createShadowRootIfSupported(
        container,
        cssFile,
    )
    document.body.appendChild(container)

    return { rootElement, shadow }
}

export function destroyRootElement() {
    const container = document.querySelector(`.${CONTAINER_CLASS}`)
    if (container) {
        container.remove()
    }
}

export function createShadowRootIfSupported(
    container: HTMLElement,
    cssFile?: string,
) {
    const rootElement = document.createElement('div')
    let shadow = null
    if (container.attachShadow) {
        shadow = container.attachShadow({ mode: 'closed' })
        shadow.appendChild(rootElement)
        injectCSS(cssFile, shadow)
    } else {
        container.appendChild(rootElement)
        injectCSS(cssFile)
    }

    return { rootElement, shadow }
}
