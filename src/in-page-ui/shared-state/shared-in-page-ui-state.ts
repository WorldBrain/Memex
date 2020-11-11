import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'

import {
    SharedInPageUIInterface,
    SharedInPageUIEvents,
    InPageUIComponentShowState,
    InPageUIComponent,
    InPageUIRibbonAction,
    SidebarActionOptions,
    ShouldSetUpOptions,
} from './types'
import {
    getRemoteEventEmitter,
    TypedRemoteEventEmitter,
} from 'src/util/webextensionRPC'
import { ContentSharingEvents } from 'src/content-sharing/background/types'

export interface SharedInPageUIDependencies {
    getNormalizedPageUrl: () => string
    loadComponent: (component: InPageUIComponent) => void
    unloadComponent: (component: InPageUIComponent) => void
}

export class SharedInPageUIState implements SharedInPageUIInterface {
    contentSharingEvents: TypedRemoteEventEmitter<'contentSharing'>
    events = new EventEmitter() as TypedEventEmitter<SharedInPageUIEvents>
    componentsShown: InPageUIComponentShowState = {
        ribbon: false,
        sidebar: false,
        tooltip: false,
        highlights: false,
    }
    componentsSetUp: InPageUIComponentShowState = {
        ribbon: false,
        sidebar: false,
        tooltip: false,
        highlights: false,
    }
    _pendingEvents: {
        sidebarAction?: {
            emittedWhen: number
        } & SidebarActionOptions
        ribbonAction?: { emittedWhen: number; action: InPageUIRibbonAction }
    } = {}

    constructor(private options: SharedInPageUIDependencies) {
        this.events.on('newListener' as any, this._handleNewListener)

        this.contentSharingEvents = getRemoteEventEmitter('contentSharing')
        this.contentSharingEvents.on(
            'pageAddedToSharedList',
            this.handlePageAddedToSharedList,
        )
    }

    private handlePageAddedToSharedList: ContentSharingEvents['pageAddedToSharedList'] = ({
        pageUrl,
    }) => {
        if (pageUrl !== this.options.getNormalizedPageUrl()) {
            return
        }

        this._emitAction({
            type: 'sidebarAction',
            action: 'set_sharing_access',
            annotationSharingAccess: 'sharing-allowed',
        })
    }

    _handleNewListener = (
        eventName: keyof SharedInPageUIEvents,
        listener: (...args: any[]) => void,
    ) => {
        if (eventName !== 'ribbonAction' && eventName !== 'sidebarAction') {
            return
        }

        if (!this._pendingEvents[eventName]) {
            return
        }

        // If this event was emitted less than 5 seconds ago
        if (
            this._pendingEvents[eventName].emittedWhen >
            Date.now() - 1000 * 5
        ) {
            listener(this._pendingEvents[eventName] as any)
        }

        delete this._pendingEvents[eventName]
    }

    async showSidebar(options?: SidebarActionOptions) {
        const maybeEmitAction = () => {
            if (options?.action) {
                this._emitAction({
                    type: 'sidebarAction',
                    ...options,
                })
            }
        }

        if (this.componentsShown.sidebar) {
            maybeEmitAction()
            return
        }

        await this._setState('sidebar', true)
        maybeEmitAction()
        this.showRibbon()
    }

    _emitAction(
        params:
            | ({
                  type: 'sidebarAction'
              } & SidebarActionOptions)
            | { type: 'ribbonAction'; action: InPageUIRibbonAction },
    ) {
        const handled =
            params.type === 'sidebarAction'
                ? this.events.emit('sidebarAction', params)
                : this.events.emit('ribbonAction', params)

        if (!handled) {
            this._pendingEvents[params.type] = {
                ...params,
                emittedWhen: Date.now(),
            } as any
        }
    }

    async hideSidebar() {
        await this._setState('sidebar', false)
    }

    async toggleSidebar() {
        if (this.componentsShown.sidebar) {
            await this.hideSidebar()
        } else {
            await this.showSidebar({ action: 'comment' })
        }
    }

    async loadComponent(
        component: InPageUIComponent,
        options: ShouldSetUpOptions = {},
    ) {
        console.log('loadComp:', component)
        await this.options.loadComponent(component)
        this._maybeEmitShouldSetUp(component, options)
    }

    async showRibbon(options?: { action?: InPageUIRibbonAction }) {
        const maybeEmitAction = () => {
            if (options?.action) {
                this._emitAction({
                    type: 'ribbonAction',
                    action: options.action,
                })
            }
        }

        if (this.componentsShown.ribbon) {
            maybeEmitAction()
            return
        }

        await this._setState('ribbon', true)
        maybeEmitAction()
    }

    async hideRibbon() {
        await this._setState('ribbon', false)
    }

    async removeRibbon() {
        if (this.componentsSetUp.sidebar) {
            await this._removeComponent('sidebar')
        }
        await this._removeComponent('ribbon')
    }

    async reloadRibbon() {
        await this.reloadComponent('ribbon')
        await this.reloadComponent('sidebar')
    }

    async toggleRibbon() {
        if (this.componentsShown.ribbon) {
            await this.hideRibbon()
        } else {
            await this.showRibbon()
        }
    }

    updateRibbon() {
        this.events.emit('ribbonUpdate')
    }

    async setupTooltip() {
        await this.loadComponent('tooltip')
    }

    async showTooltip() {
        await this._setState('tooltip', true)
    }

    async hideTooltip() {
        await this._setState('tooltip', false)
    }

    async removeTooltip() {
        await this._removeComponent('tooltip')
    }

    async toggleTooltip() {
        if (this.componentsSetUp.tooltip) {
            await this.removeTooltip()
        } else {
            await this.showTooltip()
        }
    }

    async hideHighlights() {
        await this._setState('highlights', false)
    }

    async showHighlights() {
        await this._setState('highlights', true)
    }

    async toggleHighlights() {
        if (this.componentsShown.highlights) {
            await this.hideHighlights()
        } else {
            await this.showHighlights()
        }
    }

    private async _setState(component: InPageUIComponent, visible: boolean) {
        if (this.componentsShown[component] === visible) {
            return
        }

        if (visible) {
            await this.loadComponent(component, {
                showSidebarOnLoad: component === 'sidebar',
            })
        }

        this.componentsShown[component] = visible

        this.events.emit('stateChanged', {
            newState: this.componentsShown,
            changes: { [component]: this.componentsShown[component] },
        })
    }

    _removeComponent(component: InPageUIComponent) {
        this.options.unloadComponent(component)
        this.componentsShown[component] = false
        this.componentsSetUp[component] = false
        this.events.emit('componentShouldDestroy', { component })
    }

    async reloadComponent(
        component: InPageUIComponent,
        options: ShouldSetUpOptions = {},
    ) {
        await this.options.loadComponent(component)
        this.events.emit('componentShouldSetUp', { component, options })
    }

    private _maybeEmitShouldSetUp(
        component: InPageUIComponent,
        options: ShouldSetUpOptions = {},
    ) {
        console.log('maybe emit:', component, options, this.componentsSetUp)
        if (!this.componentsSetUp[component]) {
            this.events.emit('componentShouldSetUp', { component, options })
            this.componentsSetUp[component] = true
        }
    }
}
