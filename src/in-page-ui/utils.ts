import retargetEvents from 'react-shadow-dom-retarget-events'
import { createInPageUIRoot } from './dom'

export function createInPageUI(name: string, cssFile: string) {
    const mount = createInPageUIRoot({
        containerId: `memex-${name}-container`,
        rootId: `memex-${name}`,
        classNames: [`memex-${name}`],
        cssFile,
    })

    retargetEvents(mount.shadowRoot)

    return mount
}
