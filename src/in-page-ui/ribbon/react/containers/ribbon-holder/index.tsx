import * as React from 'react'
import cx from 'classnames'
import {
    RibbonHolderDependencies,
    RibbonHolderState,
    RibbonHolderLogic,
    RibbonHolderEvents,
} from './logic'
import { StatefulUIElement } from 'src/util/ui-logic'
import RibbonContainer from '../ribbon'
import { InPageUIEvents } from 'src/in-page-ui/shared-state/types'
const styles = require('./styles.css')

const RIBBON_HIDE_TIMEOUT = 700

export interface RibbonHolderProps extends RibbonHolderDependencies {}

export default class RibbonHolder extends StatefulUIElement<
    RibbonHolderProps,
    RibbonHolderState,
    RibbonHolderEvents
> {
    mouseInRibbon = false
    mouseInHolder = false
    isAnyPopupOpen = false
    hideTimeout?: ReturnType<typeof setTimeout>
    holderEl: HTMLElement
    ribbonEl: HTMLElement

    constructor(props) {
        super(props, new RibbonHolderLogic(props))
    }

    componentDidMount() {
        super.componentDidMount()
        this.props.inPageUI.events.on(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
    }

    componentWillUnmount() {
        clearTimeout(this.hideTimeout)
        super.componentWillUnmount()
        this.removeEventListeners()
        this.props.inPageUI.events.removeListener(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
    }

    private setAutoHide = (shouldAutoHide: boolean) => {
        this.isAnyPopupOpen = !shouldAutoHide

        if (shouldAutoHide) {
            this.hideRibbonWithTimeout()
        }
    }

    handleInPageUIStateChange: InPageUIEvents['stateChanged'] = ({
        changes,
    }) => {
        if ('ribbon' in changes) {
            if (changes.ribbon) {
                this.showRibbon()
            } else {
                this.hideRibbon()
            }
        }
    }

    private handleHolderRef = (ref: HTMLDivElement) => {
        if (!ref) {
            return
        }

        this.holderEl = ref
        this.holderEl.addEventListener(
            'mouseenter',
            this.handleMouseEnterHolder,
        )
        this.holderEl.addEventListener('mouseleave', this.hideRibbonWithTimeout)
    }

    private handleRibbonRef = (ref: HTMLDivElement) => {
        if (!ref) {
            return
        }

        this.ribbonEl = ref
        this.ribbonEl.addEventListener(
            'mouseenter',
            this.handleMouseEnterRibbon,
        )
        this.ribbonEl.addEventListener(
            'mouseleave',
            this.handleMouseLeaveRibbon,
        )
    }

    private removeEventListeners() {
        this.holderEl.removeEventListener(
            'mouseenter',
            this.handleMouseEnterHolder,
        )
        this.holderEl.removeEventListener(
            'mouseleave',
            this.hideRibbonWithTimeout,
        )

        this.ribbonEl.removeEventListener(
            'mouseenter',
            this.handleMouseEnterRibbon,
        )
        this.ribbonEl.removeEventListener(
            'mouseleave',
            this.handleMouseLeaveRibbon,
        )
    }

    private handleMouseLeaveRibbon = () => {
        this.mouseInRibbon = false
    }

    private handleMouseEnterRibbon = () => {
        this.mouseInRibbon = true
        this.props.inPageUI.showRibbon()
    }

    private handleMouseEnterHolder = () => {
        this.mouseInHolder = true
        this.props.inPageUI.showRibbon()
    }

    private hideRibbonWithTimeout = () => {
        this.mouseInHolder = false
        if (this.hideTimeout) {
            return
        }

        this.hideTimeout = setTimeout(() => {
            delete this.hideTimeout
            if (
                !this.mouseInHolder &&
                !this.mouseInRibbon &&
                !this.isAnyPopupOpen
            ) {
                this.props.inPageUI.hideRibbon()
            }
        }, RIBBON_HIDE_TIMEOUT)
    }

    showRibbon = () => this.processEvent('show', null)

    hideRibbon = () => this.processEvent('hide', null)

    render() {
        return (
            <div
                ref={this.handleHolderRef}
                className={cx(styles.holder, {
                    [styles.withSidebar]: this.state.isSidebarOpen,
                })}
            >
                <RibbonContainer
                    {...this.props.containerDependencies}
                    setRef={this.handleRibbonRef}
                    state={this.state.state}
                    inPageUI={this.props.inPageUI}
                    isSidebarOpen={this.state.isSidebarOpen}
                    openSidebar={() => this.props.inPageUI.showSidebar()}
                    closeSidebar={() => this.props.inPageUI.hideSidebar()}
                    setRibbonShouldAutoHide={this.setAutoHide}
                />
            </div>
        )
    }
}
