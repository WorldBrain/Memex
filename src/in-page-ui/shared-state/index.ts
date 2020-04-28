import EventEmitter from 'events'
import {
    InPageUIInterface,
    InPageUIEvents,
    InPageUIState,
    InPageUIComponent,
    InPageUIRibbonAction,
    InPageUISidebarAction,
} from './types'
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

    async showSidebar(options?: { action?: InPageUISidebarAction }) {
        const maybeEmitAction = () => {
            if (options?.action) {
                this.events.emit('sidebarAction', { action: options.action })
            }
        }

        if (this.state.sidebar) {
            maybeEmitAction()
            return
        }

        await this.loadComponent('sidebar')
        this.state.sidebar = true
        this.showRibbon()
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { sidebar: this.state.sidebar },
        })
        maybeEmitAction()
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

    async showRibbon(options?: { action?: InPageUIRibbonAction }) {
        const maybeEmitAction = () => {
            if (options?.action) {
                this.events.emit('ribbonAction', { action: options.action })
            }
        }

        if (this.state.ribbon) {
            maybeEmitAction()
            return
        }

        await this.loadComponent('ribbon')
        this.state.ribbon = true
        this.events.emit('stateChanged', {
            newState: this.state,
            changes: { ribbon: this.state.ribbon },
        })
        this.loadComponent('sidebar')
        maybeEmitAction()
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

    removeRibbon() {
        if (this.componentsSetUp.sidebar) {
            this._removeComponent('sidebar')
        }
        this._removeComponent('ribbon')
    }

    _removeComponent(component: InPageUIComponent) {
        this.state[component] = false
        this.componentsSetUp[component] = false
        this.events.emit('componentShouldDestroy', { component })
    }

    toggleHighlights(): void {}

    _maybeEmitShouldSetUp(component: InPageUIComponent) {
        if (!this.componentsSetUp[component]) {
            this.events.emit('componentShouldSetUp', { component })
            this.componentsSetUp[component] = true
        }
    }
}
