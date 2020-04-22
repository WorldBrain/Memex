import EventEmitter from 'event-emitter'
import {
    SidebarControllerInterface,
    SidebarControllerEventEmitter,
} from './types'

export class SidebarController implements SidebarControllerInterface {
    events = new EventEmitter() as SidebarControllerEventEmitter
    state: 'visible' | 'hidden' = 'hidden'
    private created = false

    constructor(
        private options: {
            createUI: () => void
        },
    ) {}

    showSidebar(): void {
        if (!this.created) {
            this.options.createUI()
            this.created = true
        }
        this.state = 'visible'
        this.events.emit('showSidebar')
    }

    hideSidebar(): void {
        this.state = 'hidden'
        this.events.emit('hideSidebar')
    }
}
