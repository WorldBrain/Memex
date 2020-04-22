import EventEmitter from 'event-emitter'
import retargetEvents from 'react-shadow-dom-retarget-events'
import {
    RibbonControllerInterface,
    RibbonControllerEventEmitter,
} from './types'
import { createInPageUIRoot } from '../dom'
// import { setupSidebarUI } from './react'

export class RibbonController implements RibbonControllerInterface {
    events = new EventEmitter() as RibbonControllerEventEmitter
    state: 'visible' | 'hidden' = 'hidden'

    showRibbon(): void {
        this.state = 'visible'
        this.events.emit('showRibbon')
    }

    hideRibbon(): void {
        this.state = 'hidden'
        this.events.emit('hideRibbon')
    }
}
