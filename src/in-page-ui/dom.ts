import { injectCSS } from 'src/util/content-injection'

export function createInPageUIRoot({
    containerId,
    rootId,
    classNames,
    cssFile,
}: {
    containerId: string
    rootId: string
    classNames?: string[]
    cssFile: string
}) {
    const container = document.createElement('div')
    container.setAttribute('id', containerId)

    const { rootElement, shadow } = createShadowRootIfSupported(
        container,
        rootId,
        classNames,
        cssFile,
    )
    document.body.appendChild(container)

    return { rootElement, shadowRoot: shadow }
}

export function destroyRootElement(containerId: string) {
    const container = document.querySelector(`#${containerId}`)
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

    let shadow: ShadowRoot | null = null
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
