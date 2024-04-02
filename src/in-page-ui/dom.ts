import { injectCSS } from 'src/util/content-injection'
import { runtime } from 'webextension-polyfill'
import type { InPageUIRootMount } from './types'

export function createInPageUIRoot({
    containerId,
    rootId,
    cssFile,
    rootClassNames,
    containerClassNames,
}: {
    containerId: string
    rootId: string
    cssFile?: string
    rootClassNames?: string[]
    containerClassNames?: string[]
}): InPageUIRootMount {
    const container = document.createElement('div')
    container.setAttribute('id', containerId)

    if (containerClassNames != null) {
        container.classList.add(...containerClassNames)
    }

    const { rootElement, shadow } = createShadowRootIfSupported(
        container,
        rootId,
        rootClassNames,
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
    rootClassNames?: string[],
    cssFile?: string,
) {
    const rootElement = document.createElement('div')
    rootElement.setAttribute('id', rootId)

    if (rootClassNames != null) {
        rootElement.classList.add(...rootClassNames)
    }

    let shadow: ShadowRoot | null = null
    if (container.attachShadow) {
        /** 'open' mode to access shadow dom elements from outisde the shadow root.
         * More info: https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#Parameters
         */
        shadow = container.attachShadow({ mode: 'open' })
        const fontFile = runtime.getURL('/fonts/Satoshi/satoshi.css')
        const style = document.createElement('style')
        style.dataset.description = 'memex-satoshi-font-faces'

        style.appendChild(document.createTextNode(styles))
        document.head.appendChild(style)

        var innerHTML = ''
        innerHTML += '<style>'
        innerHTML +=
            ':host {all: initial, font-family: "Satoshi"} :host * {font-family: "Satoshi"; line-height: initial}'
        innerHTML += `</style> <link rel="stylesheet" href="${fontFile}" />`
        shadow.innerHTML = innerHTML

        shadow.appendChild(rootElement)
        if (cssFile != null) {
            injectCSS(cssFile, shadow)
        }
    } else {
        container.appendChild(rootElement)
        if (cssFile != null) {
            injectCSS(cssFile)
        }
    }

    return { rootElement, shadow }
}

const rootDirectory = runtime.getURL('/fonts/Satoshi/')

const styles = `
@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Variable.woff) format('woff'),
        url(${rootDirectory}Satoshi-Variable.ttf) format('truetype');
    font-weight: 300;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-VariableItalic.woff) format('woff'),
        url(${rootDirectory}Satoshi-VariableItalic.ttf) format('truetype');
    font-weight: 300;
    font-display: swap;
    font-style: italic;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Light.woff) format('woff'),
        url(${rootDirectory}Satoshi-Light.ttf) format('truetype');
    font-weight: 300;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-LightItalic.woff) format('woff'),
        url(${rootDirectory}Satoshi-LightItalic.ttf) format('truetype');
    font-weight: 300;
    font-display: swap;
    font-style: italic;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Regular.woff) format('woff'),
        url(${rootDirectory}Satoshi-Regular.ttf) format('truetype');
    font-weight: 400;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Italic.woff) format('woff'),
        url(${rootDirectory}Satoshi-Italic.ttf) format('truetype');
    font-weight: 400;
    font-display: swap;
    font-style: italic;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Medium.woff) format('woff'),
        url(${rootDirectory}Satoshi-Medium.ttf) format('truetype');
    font-weight: 500;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-MediumItalic.woff) format('woff'),
        url(${rootDirectory}Satoshi-MediumItalic.ttf) format('truetype');
    font-weight: 500;
    font-display: swap;
    font-style: italic;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Bold.woff) format('woff'),
        url(${rootDirectory}Satoshi-Bold.ttf) format('truetype');
    font-weight: 700;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-BoldItalic.woff) format('woff'),
        url(${rootDirectory}Satoshi-BoldItalic.ttf) format('truetype');
    font-weight: 700;
    font-display: swap;
    font-style: italic;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-Black.woff) format('woff'),
        url(${rootDirectory}Satoshi-Black.ttf) format('truetype');
    font-weight: 900;
    font-display: swap;
    font-style: normal;
}

@font-face {
    font-family: 'Satoshi';
    src:
        url(${rootDirectory}Satoshi-BlackItalic.woff) format('woff'),
        url(${rootDirectory}Satoshi-BlackItalic.ttf) format('truetype');
    font-weight: 900;
    font-display: swap;
    font-style: italic;
}

`
