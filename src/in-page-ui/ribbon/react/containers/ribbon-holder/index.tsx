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
import type { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
import PageActivityIndicator from 'src/page-activity-indicator/ui/indicator'
import styled, { css } from 'styled-components'
import { TOOLTIP_HEIGHT, TOOLTIP_WIDTH } from 'src/in-page-ui/ribbon/constants'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    MemexTheme,
    MemexThemeVariant,
} from '@worldbrain/memex-common/lib/common-ui/styles/types'

const RIBBON_HIDE_TIMEOUT = 400

export interface RibbonHolderProps extends RibbonHolderDependencies {
    analyticsBG: AnalyticsCoreInterface
    theme: MemexThemeVariant
    getRootElement: () => HTMLElement
}

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

    async componentDidMount() {
        this.props.inPageUI.events.on(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
        await super.componentDidMount()
    }

    async componentWillUnmount() {
        clearTimeout(this.hideTimeout)
        this.removeEventListeners()
        this.props.inPageUI.events.removeListener(
            'stateChanged',
            this.handleInPageUIStateChange,
        )
        await super.componentWillUnmount()
    }

    private setAutoHide = (shouldAutoHide: boolean) => {
        this.isAnyPopupOpen = !shouldAutoHide
        this.mouseInRibbon = !shouldAutoHide

        if (shouldAutoHide) {
            this.hideRibbonWithTimeout()
        }
    }

    private handleInPageUIStateChange: SharedInPageUIEvents['stateChanged'] = ({
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
                        isPeeking={this.state.state === 'visible'}
                        id="memex-ribbon-holder"
                    >
                        <RibbonContainer
                            {...this.props.containerDependencies}
                            setRef={this.handleRibbonRef}
                            theme={this.props.theme}
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
                            analyticsBG={this.props.analyticsBG}
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
                {/* {this.props.setUpOptions.showNudges &&
                    !this.state.isSidebarOpen && (
                        <NudgesContainer
                            onClose={() =>
                                this.processEvent('closeNudge', null)
                            }
                            onRemove={() =>
                                this.processEvent('removeNudges', null)
                            }
                        />
                    )} */}
            </>
        )
    }
}

const RibbonHolderBox = styled.div<{
    isSidebarOpen: boolean
    isPeeking: boolean
    ribbonPosition: 'topRight' | 'bottomRight' | 'centerRight'
}>`
    position: fixed;
    right: 0;
    top: 130px;
    z-index: 2147483646;

    ${(props) =>
        (props.ribbonPosition === 'topRight' ||
            props.ribbonPosition === 'bottomRight') &&
        css<{ isSidebarOpen }>`
            display: flex;
            box-shadow: none;
            justify-content: flex-end;
            width: ${(props) =>
                props.isSidebarOpen ? 'fit-content' : TOOLTIP_WIDTH};
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
            height: 44px;
            align-items: flex-end;
            height: ${TOOLTIP_HEIGHT};
        `}
    ${(props) =>
        props.ribbonPosition === 'bottomRight' &&
        css<{ isSidebarOpen }>`
            right: 0px;
            bottom: 0px;
            height: 44px;
            top: unset;
            align-items: flex-end;
            height: ${TOOLTIP_HEIGHT};
        `}
        ${(props) =>
            props.ribbonPosition === 'centerRight' &&
            css<{ isSidebarOpen }>`
                right: 0px;
                height: calc(440px);
                width: 10px;
            `}
        ${(props) =>
            props.ribbonPosition === 'centerRight' &&
            props.isPeeking &&
            css<{ isSidebarOpen }>`
                right: 0px;
                height: fit-content;
                width: 60px;
            `}

    ${(props) =>
        props.isSidebarOpen &&
        css`
            top: 0px;
            height: fill-available;
            height: -moz-available;
            width: 44px;
            height: 100%;
        `}
`
