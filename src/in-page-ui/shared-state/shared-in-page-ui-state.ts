import { EventEmitter } from 'events'
import TypedEventEmitter from 'typed-emitter'

import {
    SharedInPageUIInterface,
    SharedInPageUIEvents,
    InPageUIComponentShowState,
    InPageUIComponent,
    InPageUIRibbonAction,
    SidebarActionOptions,
} from './types'
import {
    getRemoteEventEmitter,
    TypedRemoteEventEmitter,
} from 'src/util/webextensionRPC'
import { ContentSharingEvents } from 'src/content-sharing/background/types'

export interface SharedInPageUIDependencies {
    pageUrl: string
    normalizedPageUrl: string
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
        this.contentSharingEvents.on(
            'pageRemovedFromSharedList',
            this.handlePageRemovedFromSharedList,
        )
    }

    private handlePageAddedToSharedList: ContentSharingEvents['pageAddedToSharedList'] = ({
        pageUrl,
    }) => {
        if (pageUrl !== this.options.normalizedPageUrl) {
            return
        }

        this._emitAction({
            type: 'sidebarAction',
            action: 'set_sharing_access',
            annotationSharingAccess: 'sharing-allowed',
        })
    }

    private handlePageRemovedFromSharedList: ContentSharingEvents['pageRemovedFromSharedList'] = ({
        pageUrl,
    }) => {
        if (pageUrl !== this.options.normalizedPageUrl) {
            return
        }

        this._emitAction({
            type: 'sidebarAction',
            action: 'set_sharing_access',
            annotationSharingAccess: 'page-not-shared',
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

        this.loadComponent('sidebar')
        this._setState('sidebar', true)
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

    hideSidebar() {
        this._setState('sidebar', false)
    }

    toggleSidebar(): void {
        if (this.componentsShown.sidebar) {
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

        await this.loadComponent('ribbon')
        this._setState('ribbon', true)
        this.loadComponent('sidebar')
        maybeEmitAction()
    }

    async hideRibbon() {
        this._setState('ribbon', false)
    }

    async removeRibbon() {
        if (this.componentsSetUp.sidebar) {
            await this._removeComponent('sidebar')
        }
        await this._removeComponent('ribbon')
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

    async _setState(component: InPageUIComponent, visible: boolean) {
        if (this.componentsShown[component] === visible) {
            return
        }

        if (visible) {
            await this.loadComponent(component)
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

    _maybeEmitShouldSetUp(component: InPageUIComponent) {
        if (!this.componentsSetUp[component]) {
            this.events.emit('componentShouldSetUp', { component })
            this.componentsSetUp[component] = true
        }
    }
}
