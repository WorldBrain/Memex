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
const styles = require('./styles.css')

const RIBBON_HIDE_TIMEOUT = 700

export interface RibbonHolderProps extends RibbonHolderDependencies {}

export default class RibbonHolder extends StatefulUIElement<
    RibbonHolderProps,
    RibbonHolderState,
    RibbonHolderEvents
> {
    shouldHide = false
    hideTimeout?: ReturnType<typeof setTimeout>
    ref: HTMLElement

    constructor(props) {
        super(props, new RibbonHolderLogic(props))
    }

    componentDidMount() {
        super.componentDidMount()
        this.props.ribbonController.events.on('showRibbon', this.showRibbon)
        this.props.ribbonController.events.on('hideRibbon', this.hideRibbon)
    }

    componentWillUnmount() {
        clearTimeout(this.hideTimeout)
        super.componentWillUnmount()
        this.removeEventListeners()
        this.props.ribbonController.events.removeListener(
            'showRibbon',
            this.showRibbon,
        )
        this.props.ribbonController.events.removeListener(
            'hideRibbon',
            this.hideRibbon,
        )
    }

    handleRef = (ref: HTMLDivElement) => {
        this.ref = ref
        this.addEventListeners()
    }

    addEventListeners() {
        this.ref.addEventListener('mouseenter', this.handleMouseEnter)
        this.ref.addEventListener('mouseleave', this.hideRibbonWithTimeout)
    }

    removeEventListeners() {
        this.ref.removeEventListener(
            'mouseenter',
            this.props.inPageUI.showRibbon,
        )
        this.ref.removeEventListener('mouseleave', this.hideRibbonWithTimeout)
    }

    handleMouseEnter = () => {
        this.shouldHide = false
        this.props.inPageUI.showRibbon()
    }

    showRibbon = () => {
        this.processEvent('show', null)
    }

    hideRibbonWithTimeout = () => {
        this.shouldHide = true
        if (this.hideTimeout) {
            return
        }

        this.hideTimeout = setTimeout(() => {
            delete this.hideTimeout
            if (this.shouldHide) {
                this.props.inPageUI.hideRibbon()
            }
        }, RIBBON_HIDE_TIMEOUT)
    }

    hideRibbon = () => {
        this.processEvent('hide', null)
    }

    maybeRenderRibbon() {
        // if (this.state.state !== 'visible') {
        //     return null
        // }
        return (
            <RibbonContainer
                {...this.props.containerDependencies}
                inPageUI={this.props.inPageUI}
                ribbonController={this.props.ribbonController}
                isSidebarOpen={this.state.isSidebarOpen}
                openSidebar={() => this.props.inPageUI.showSidebar()}
                closeSidebar={() => this.props.inPageUI.hideSidebar()}
            />
        )
    }

    render() {
        return (
            <div
                ref={this.handleRef}
                className={cx(styles.holder, {
                    [styles.withSidebar]: this.state.isSidebarOpen,
                })}
            >
                {this.maybeRenderRibbon()}
            </div>
        )
    }
}
