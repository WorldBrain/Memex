import EventEmitter from 'events'
import {
    InPageUIInterface,
    InPageUIEvents,
    InPageUIState,
    InPageUIComponent,
} from './types'
import { RibbonControllerInterface } from '../ribbon/types'
import { SidebarControllerInterface } from '../sidebar/types'
import TypedEventEmitter from 'typed-emitter'

export class InPageUI implements InPageUIInterface {
    events = new EventEmitter() as TypedEventEmitter<InPageUIEvents>
    state: InPageUIState = {
        ribbon: false,
        sidebar: false,
    }
    componentsSetUp: InPageUIState = {
        ribbon: false,
        sidebar: false,
    }

    constructor(
        private options: {
            loadComponent: (component: InPageUIComponent) => void
        },
    ) {}

    async showSidebar(options?: {
        action?: 'comment' | 'tag' | 'list' | 'bookmark' | 'annotate'
    }) {
        if (this.state.sidebar) {
            return
        }

        await this.loadComponent('sidebar')
        this.state.sidebar = true
        this.showRibbon()
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { sidebar: this.state.sidebar },
        })
    }

    hideSidebar() {
        if (!this.state.sidebar) {
            return
        }

        // this.options.sidebarController.hideSidebar()
        this.state.sidebar = false
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { sidebar: this.state.sidebar },
        })
    }

    toggleSidebar(): void {
        if (this.state.sidebar) {
            this.hideSidebar()
        } else {
            this.showSidebar()
        }
    }

    async loadComponent(component: InPageUIComponent) {
        await this.options.loadComponent(component)
        this._maybeEmitShouldSetUp(component)
    }

    async showRibbon() {
        if (this.state.ribbon) {
            return
        }

        await this.loadComponent('ribbon')
        this.state.ribbon = true
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { ribbon: this.state.ribbon },
        })
    }

    hideRibbon() {
        if (!this.state.ribbon) {
            return
        }

        this.state.ribbon = false
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { ribbon: this.state.ribbon },
        })
    }

    toggleHighlights(): void {}

    _maybeEmitShouldSetUp(component: InPageUIComponent) {
        if (!this.componentsSetUp[component]) {
            this.events.emit('componentShouldSetUp', { component })
            this.componentsSetUp[component] = true
        }
    }
}
