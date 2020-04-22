import retargetEvents from 'react-shadow-dom-retarget-events'
import { createInPageUIRoot } from './dom'

export async function createInPageUI(
    name: string,
    cssFile: string,
    setupUI: (rootElement: HTMLDivElement) => void | Promise<void>,
) {
    const mount = createInPageUIRoot({
        containerId: `memex-${name}-container`,
        rootId: `memex-${name}`,
        classNames: [`memex-${name}`],
        cssFile,
    })

    retargetEvents(mount.shadowRoot)

    await setupUI(mount.rootElement)
}
