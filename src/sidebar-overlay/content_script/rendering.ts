import { browser } from 'webextension-polyfill-ts'

import { injectCSS } from 'src/util/content-injection'

const CONTAINER_CLASS = 'memex-ribbon-sidebar-container'

export function createRootElement({
    containerId,
    rootId,
    classNames,
}: {
    containerId: string
    rootId: string
    classNames?: string[]
}) {
    const container = document.createElement('div')
    container.classList.add(CONTAINER_CLASS)
    container.setAttribute('id', containerId)

    const cssFile = browser.runtime.getURL('/content_script.css')
    const { rootElement, shadow } = createShadowRootIfSupported(
        container,
        rootId,
        classNames,
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
    rootId: string,
    classNames?: string[],
    cssFile?: string,
) {
    const rootElement = document.createElement('div')
    rootElement.setAttribute('id', rootId)

    if (classNames !== undefined) {
        rootElement.classList.add(...classNames)
    }

    let shadow = null
    if (container.attachShadow) {
        /** 'open' mode to access shadow dom elements from outisde the shadow root.
         * More info: https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#Parameters
         */
        shadow = container.attachShadow({ mode: 'open' })
        shadow.appendChild(rootElement)
        injectCSS(cssFile, shadow)
    } else {
        container.appendChild(rootElement)
        injectCSS(cssFile)
    }

    return { rootElement, shadow }
}
