import EventEmitter from 'event-emitter'
import { InPageUIInterface } from './types'
import { RibbonControllerInterface } from '../ribbon/types'
import { SidebarControllerInterface } from '../sidebar/types'
import TypedEventEmitter from 'typed-emitter'

export class InPageUIState {
    ribbon: boolean
    sidebar: boolean
}
export class InPageUI implements InPageUIInterface {
    events = new EventEmitter() as TypedEventEmitter<{
        stateChanged: (event: { newState: InPageUIState }) => void
    }>
    state: InPageUIState = {
        ribbon: false,
        sidebar: false,
    }

    constructor(
        private options: {
            ribbonController: RibbonControllerInterface
            sidebarController: SidebarControllerInterface
        },
    ) {}

    showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }): void {
        if (this.state.sidebar) {
            return
        }

        this.options.sidebarController.showSidebar()
        this.state.sidebar = true
        this.showRibbon()
        this.events.emit('stateChanged', { newState: this.state })
    }

    hideSidebar() {
        if (!this.state.sidebar) {
            return
        }

        this.options.sidebarController.hideSidebar()
        this.state.sidebar = false
        this.events.emit('stateChanged', { newState: this.state })
    }

    toggleSidebar(): void {
        if (this.state.sidebar) {
            this.hideSidebar()
        } else {
            this.showSidebar()
        }
    }

    showRibbon() {
        if (this.state.ribbon) {
            return
        }

        this.options.ribbonController.showRibbon()
        this.state.ribbon = true
        this.events.emit('stateChanged', { newState: this.state })
    }

    hideRibbon() {
        if (!this.state.ribbon) {
            return
        }

        this.options.ribbonController.hideRibbon()
        this.state.ribbon = false
        this.events.emit('stateChanged', { newState: this.state })
    }

    toggleHighlights(): void {}
}
