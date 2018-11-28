const CONTAINER_CLASS = 'memex-tooltip-notification'

let rootElement = null

export function ensureRootElement() {
    if (rootElement) {
        return rootElement
    }

    const container = document.createElement('div')
    container.classList.add(CONTAINER_CLASS)

    rootElement = document.createElement('div')
    if (container.attachShadow) {
        const shadow = container.attachShadow({ mode: 'closed' })
        shadow.appendChild(rootElement)
    } else {
        document.body.appendChild(rootElement)
    }

    return rootElement
}

export function destroyRootElement() {
    const container = document.querySelector(`.${CONTAINER_CLASS}`)
    if (container) {
        container.remove()
    }
    rootElement = null
}
