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
import { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
import PageActivityIndicator from 'src/page-activity-indicator/ui/indicator'
import styled, { css } from 'styled-components'

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

        window['_getRibbonState'] = () => ({ ...this.state })
        window['_getRibbonProps'] = () => ({ ...this.props })
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
        this.mouseInRibbon = !shouldAutoHide

        if (shouldAutoHide) {
            this.hideRibbonWithTimeout()
        }
    }

    handleInPageUIStateChange: SharedInPageUIEvents['stateChanged'] = ({
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
                !this.isAnyPopupOpen &&
                !this.state.isSidebarOpen
            ) {
                this.props.inPageUI.hideRibbon()
            }
        }, RIBBON_HIDE_TIMEOUT)
    }

    showRibbon = () => this.processEvent('show', null)
    hideRibbon = () => this.processEvent('hide', null)

    render() {
        return (
            <>
                {(!this.props.setUpOptions.keepRibbonHidden ||
                    this.state.state === 'visible') && (
                    <RibbonHolderBox
                        ref={this.handleHolderRef}
                        isSidebarOpen={this.state.isSidebarOpen}
                        ribbonPosition={this.state.ribbonPosition}
                    >
                        <RibbonContainer
                            {...this.props.containerDependencies}
                            setRef={this.handleRibbonRef}
                            state={this.state.state}
                            inPageUI={this.props.inPageUI}
                            isSidebarOpen={this.state.isSidebarOpen}
                            setRibbonShouldAutoHide={this.setAutoHide}
                            openPDFinViewer={
                                this.props.containerDependencies.openPDFinViewer
                            }
                            ribbonPosition={this.state.ribbonPosition}
                            selectRibbonPositionOption={(position) =>
                                this.processEvent(
                                    'selectRibbonPositionOption',
                                    position,
                                )
                            }
                        />
                    </RibbonHolderBox>
                )}
                {this.props.setUpOptions.showPageActivityIndicator &&
                    !this.state.isSidebarOpen &&
                    !this.state.keepPageActivityIndicatorHidden && (
                        <PageActivityIndicator
                            onGoToClick={() =>
                                this.processEvent(
                                    'openSidebarToSharedSpaces',
                                    null,
                                )
                            }
                        />
                    )}
            </>
        )
    }
}

const RibbonHolderBox = styled.div<{
    isSidebarOpen: boolean
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
}>`
    position: fixed;
    right: 0;
    top: 130px;
    z-index: 2147483647;

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css<{ isSidebarOpen }>`
            display: flex;
            box-shadow: none;
            justify-content: flex-end;
            width: ${(props) => (props.isSidebarOpen ? 'fit-content' : '50px')};
            align-items: flex-start;
            transition: unset;

            & .removeSidebar {
                visibility: hidden;
                display: none;
            }
        `}
    ${(props) =>
        props.ribbonPosition === 'topRight' &&
        css<{ isSidebarOpen }>`
            right: 0px;
            top: 0px;
            align-items: flex-start;
            height: 42px;
        `}
    ${(props) =>
        props.ribbonPosition === 'bottomRight' &&
        css<{ isSidebarOpen }>`
            right: 0px;
            bottom: 0px;
            top: unset;
            align-items: flex-end;
            height: 42px;
        `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            top: 0px;
            height: 100%;
        `}
`
