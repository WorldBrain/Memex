import retargetEvents from 'react-shadow-dom-retarget-events'
import { createInPageUIRoot, destroyRootElement } from './dom'

export function createInPageUI(
    name: string,
    cssFile: string,
    containerClassNames?: string[],
) {
    const mount = createInPageUIRoot({
        containerId: `memex-${name}-container`,
        rootId: `memex-${name}`,
        rootClassNames: [`memex-${name}`],
        containerClassNames,
        cssFile,
    })

    retargetEvents(mount.shadowRoot)

    return mount
}

export function destroyInPageUI(name: string) {
    return destroyRootElement(`memex-${name}-container`)
}
