import EventEmitter from 'event-emitter'
import {
    SidebarControllerInterface,
    SidebarControllerEventEmitter,
} from './types'

export class Sidebar implements SidebarControllerInterface {
    events = new EventEmitter() as SidebarControllerEventEmitter
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
        this.events.emit('showSidebar')
    }

    hideSidebar(): void {
        this.events.emit('hideSidebar')
    }
}
