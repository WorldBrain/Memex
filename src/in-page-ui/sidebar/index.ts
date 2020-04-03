import EventEmitter from 'event-emitter'
import retargetEvents from 'react-shadow-dom-retarget-events'
import {
    SidebarControllerInterface,
    SidebarControllerEventEmitter,
} from './types'
import { createInPageUIRoot } from '../dom'
import { setupSidebarUI } from './react'

export class Sidebar implements SidebarControllerInterface {
    private events = new EventEmitter() as SidebarControllerEventEmitter
    private mount?: { rootElement: HTMLElement; shadowRoot?: ShadowRoot }

    constructor(
        private options: {
            cssFile: string
        },
    ) {}

    showSidebar(): void {
        if (!this.mount) {
            this._createSidebar()
        }
        this.events.emit('showSidebar')
    }

    hideSidebar(): void {
        this.events.emit('hideSidebar')
    }

    _createSidebar() {
        this.mount = createInPageUIRoot({
            containerId: 'memex-sidebar-container',
            rootId: 'memex-sidebar',
            classNames: ['memex-sidebar'],
            cssFile: this.options.cssFile,
        })
        console.log(this.mount)

        retargetEvents(this.mount.shadowRoot)

        setupSidebarUI(this.mount.rootElement, {
            sidebarEvents: this.events,
        })
    }
}
