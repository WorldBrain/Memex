import EventEmitter from 'events'
import TypedEventEmitter from 'typed-emitter'

import {
    SharedInPageUIInterface,
    SharedInPageUIEvents,
    InPageUIComponentShowState,
    InPageUIComponent,
    InPageUIRibbonAction,
    SidebarActionOptions,
} from './types'
import { HighlightInteraction } from 'src/highlighting/ui/highlight-interactions'
import { AnnotationInterface } from 'src/direct-linking/background/types'
import { Annotation } from 'src/annotations/types'

export interface InPageUIDependencies {
    pageUrl: string
    highlighter: HighlightInteraction
    annotations: AnnotationInterface<'caller'>
    loadComponent: (component: InPageUIComponent) => void
}

export class SharedInPageUIState implements SharedInPageUIInterface {
    contentAnnotations: Annotation[]
    events = new EventEmitter() as TypedEventEmitter<SharedInPageUIEvents>
    areHighlightsShown = false
    componentsShown: InPageUIComponentShowState = {
        ribbon: false,
        sidebar: false,
        tooltip: false,
    }
    componentsSetUp: InPageUIComponentShowState = {
        ribbon: false,
        sidebar: false,
        tooltip: false,
    }
    _pendingEvents: {
        sidebarAction?: {
            emittedWhen: number
        } & SidebarActionOptions
        ribbonAction?: { emittedWhen: number; action: InPageUIRibbonAction }
    } = {}
    contentAnnotations = []

    constructor(private options: InPageUIDependencies) {
        this.events.on('newListener' as any, this._handleNewListener)
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
        await this.options.highlighter.removeHighlights()
        this.areHighlightsShown = false
    }

    async showHighlights() {
        const { annotations, highlighter, pageUrl: url } = this.options

        const pageAnnotations = await annotations.getAllAnnotationsByUrl({
            url,
        })

        const highlightables = pageAnnotations.filter(
            (annotation) => annotation.selector,
        )

        if ((highlightables?.length ?? 0) === 0) {
            return false
        }

        await highlighter.renderHighlights(highlightables, ({ activeUrl }) =>
            this.showSidebar({
                annotationUrl: activeUrl,
                action: 'show_annotation',
            }),
        )
        this.areHighlightsShown = true
        return this.areHighlightsShown
    }

    async toggleHighlights() {
        if (this.areHighlightsShown) {
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
