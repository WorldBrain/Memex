import EventEmitter from 'event-emitter'
import retargetEvents from 'react-shadow-dom-retarget-events'
import {
    RibbonControllerInterface,
    RibbonControllerEventEmitter,
} from './types'
import { createInPageUIRoot } from '../dom'
// import { setupSidebarUI } from './react'

export class Ribbon implements RibbonControllerInterface {
    events = new EventEmitter() as RibbonControllerEventEmitter
    private created = false

    constructor(
        private options: {
            createUI: () => void
        },
    ) {}

    showRibbon(): void {
        if (!this.created) {
            this.options.createUI()
            this.created = true
        }
        this.events.emit('showRibbon')
    }

    hideRibbon(): void {
        this.events.emit('hideRibbon')
    }
}
