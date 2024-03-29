import ReactDOM from 'react-dom'
import { createInPageUIRoot, destroyRootElement } from './dom'

export function createInPageUI(
    name: string,
    cssFile?: string,
    containerClassNames?: string[],
) {
    const mount = createInPageUIRoot({
        containerId: `memex-${name}-container`,
        rootId: `memex-${name}`,
        rootClassNames: [`memex-${name}`],
        containerClassNames,
        cssFile,
    })

    // retargetEvents(mount.shadowRoot)

    return mount
}

export function destroyInPageUI(name: string) {
    return destroyRootElement(`memex-${name}-container`)
}

export function unmountInPageUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
