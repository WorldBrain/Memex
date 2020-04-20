import * as React from 'react'
import * as ReactDOM from 'react-dom'
import RibbonContainer from './containers/ribbon'
import { RibbonControllerEventEmitter } from '../types'

export function setupRibbonUI(
    target: HTMLElement,
    options: {
        ribbonEvents: RibbonControllerEventEmitter
    },
) {
    // ReactDOM.render(<RibbonContainer {...options} />, target)
}

export function destroyRibbonUI(target: HTMLElement, shadowRoot?: ShadowRoot) {
    ReactDOM.unmountComponentAtNode(target)

    if (shadowRoot) {
        shadowRoot.removeChild(target)
    } else {
        document.body.removeChild(target)
    }
}
