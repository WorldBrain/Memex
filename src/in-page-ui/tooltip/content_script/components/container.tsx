import React from 'react'
import styled, { keyframes } from 'styled-components'
import {
    // CopiedComponent,
    // CreatingLinkComponent,
    // DoneComponent,
    // ErrorComponent,
    InitialComponent,
} from './tooltip-states'

import { conditionallyRemoveOnboardingSelectOption } from '../../onboarding-interactions'
import { STAGES } from 'src/overview/onboarding/constants'
import { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
import type {
    TooltipInPageUIInterface,
    AnnotationFunctions,
    TooltipPosition,
} from 'src/in-page-ui/tooltip/types'
import { ClickAway } from '@worldbrain/memex-common/lib/common-ui/components/click-away-wrapper'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import type { Shortcut } from 'src/in-page-ui/keyboard-shortcuts/types'
import AIInterfaceForTooltip from './aIinterfaceComponent'
import { SummarizationInterface } from 'src/summarization-llm/background'
import { Rnd } from 'react-rnd'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import debounce from 'lodash/debounce'

export interface Props extends AnnotationFunctions {
    inPageUI: TooltipInPageUIInterface
    summarizeBG: SummarizationInterface
    onInit: any
    destroyTooltip: any
}

interface TooltipContainerState {
    showTooltip: boolean
    showingCloseMessage?: boolean
    position: { x: number; y: number } | {}
    tooltipState: 'copied' | 'running' | 'pristine' | 'done' | 'AIinterface'
    keyboardShortCuts: {}
    highlightText: string
    removeAfterUse: boolean
    preventClosing: boolean
}

async function getShortCut(name: string) {
    let keyboardShortcuts = await getKeyboardShortcutsState()
    const short: Shortcut = keyboardShortcuts[name]

    let shortcut = short.shortcut.split('+')

    return shortcut
}

class TooltipContainer extends React.Component<Props, TooltipContainerState> {
    state: TooltipContainerState = {
        showTooltip: false,
        position: {},
        tooltipState: 'copied',
        keyboardShortCuts: undefined,
        highlightText: '',
        removeAfterUse: false,
        preventClosing: true,
    }

    private container = document.getElementById('memex-tooltip-container')

    async componentDidMount() {
        this.props.inPageUI.events?.on('stateChanged', this.handleUIStateChange)
        this.props.onInit(this.showTooltip)
        this.setState({
            keyboardShortCuts: {
                createHighlight: await getShortCut('createHighlight'),
                createAnnotation: await getShortCut('createAnnotation'),
                createAnnotationWithSpace: await getShortCut('addToCollection'),
                openToolTipInAIMode: await getShortCut('openToolTipInAIMode'),
            },
        })

        // window.addEventListener('mouseup', this.handleClick)
    }

    handleClick = (e: MouseEvent) => {
        let clickX = e.clientX
        let clickY = e.clientY

        if (e.composedPath().includes(this.container)) {
            return
        } else {
            // this.setState({
            //     position: { x: clickX, y: clickY },
            // })
        }
    }

    componentWillUnmount() {
        this.props.inPageUI.events?.removeListener(
            'stateChanged',
            this.handleUIStateChange,
        )
        window.removeEventListener('mouseUp', this.handleClick)
    }

    handleUIStateChange: SharedInPageUIEvents['stateChanged'] = (event) => {
        if (!('tooltip' in event.changes)) {
            return
        }

        if (event.changes.tooltip != null) {
            if (event.mode === 'AImode') {
                this.setState({
                    highlightText: window.getSelection().toString() ?? '',
                })
                let newPositionX = window.innerWidth / 2
                let newPositionY = window.innerHeight / 2 - 300
                this.setState({
                    showTooltip: true,
                    tooltipState: 'AIinterface',
                    position: { x: newPositionX, y: newPositionY },
                    removeAfterUse: !event.changes.tooltip ? true : false,
                })
            }
        }

        if (!event.newState.tooltip && event.mode == null) {
            this.setState({
                showTooltip: false,
                position: {},
            })
        }
    }

    calculateTooltipPostion(): TooltipPosition {
        const range = document.getSelection().getRangeAt(0)
        const boundingRect = range.getBoundingClientRect()
        // x = position of element from the left + half of it's width
        const x = boundingRect.left + boundingRect.width / 2
        // y = scroll height from top + pixels from top + height of element - offset
        const y =
            window.pageYOffset + boundingRect.top + boundingRect.height - 20
        console.log(x, y)
        return {
            x,
            y,
        }
    }

    showTooltip = () => {
        if (!this.state.showTooltip && this.state.tooltipState !== 'running') {
            this.setState({
                preventClosing: true,
            })

            setTimeout(() => {
                let position = this.calculateTooltipPostion()

                console.log('positionshow', position)
                this.setState({
                    showTooltip: true,
                    position,
                    tooltipState: 'pristine',
                    preventClosing: true,
                    highlightText: window.getSelection().toString() ?? '',
                })
            }, 200)
            setTimeout(() => {
                this.setState({
                    preventClosing: false,
                })
            }, 400)
        }
    }

    handleClickOutside = async () => {
        this.props.inPageUI.hideTooltip()
        // Remove onboarding select option notification if it's present
        await conditionallyRemoveOnboardingSelectOption(
            STAGES.annotation.notifiedHighlightText,
        )
    }

    closeTooltip = (event, options = { disable: false }) => {
        event.preventDefault()
        event.stopPropagation()

        this.props.inPageUI.removeTooltip()
    }

    showCloseMessage() {
        this.setState({ showingCloseMessage: true })
    }

    private createAnnotation: React.MouseEventHandler = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await this.props.createAnnotation(e.shiftKey)
            // Remove onboarding select option notification if it's present
            await conditionallyRemoveOnboardingSelectOption(
                STAGES.annotation.annotationCreated,
            )
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private createHighlight: React.MouseEventHandler = async (e) => {
        // this.setState({ tooltipState: 'running' })
        try {
            await this.props.createHighlight(e.shiftKey)
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            // this.setState({ tooltipState: 'pristine' })
            this.props.inPageUI.hideTooltip()
        }
    }

    private addtoSpace: React.MouseEventHandler = async (e) => {
        try {
            await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            // this.setState({ tooltipState: 'pristine' })
            window.getSelection().empty()
            this.props.inPageUI.hideTooltip()
        }
    }
    private openAIinterface: React.MouseEventHandler = async (e) => {
        let newPositionX = 0
        let newPositionY = 0

        this.setState({
            tooltipState: 'AIinterface',
            position: { x: newPositionX, y: newPositionY },
        })
        // this.props.inPageUI.hideTooltip()
        try {
            // await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            // // this.setState({ tooltipState: 'pristine' })
            // window.getSelection().empty()
            // this.props.inPageUI.hideTooltip()
        }
    }

    renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                if (this.state.keyboardShortCuts != null) {
                    return (
                        <InitialComponent
                            createHighlight={this.createHighlight}
                            createAnnotation={this.createAnnotation}
                            addtoSpace={this.addtoSpace}
                            openAIinterface={this.openAIinterface}
                            closeTooltip={this.closeTooltip}
                            state={this.state.tooltipState}
                            keyboardShortCuts={this.state.keyboardShortCuts}
                        />
                    )
                } else {
                    return undefined
                }
            case 'AIinterface':
                return (
                    <AIInterfaceForTooltip
                        sendAIprompt={async (prompt) => {
                            const textToSummarize = this.state.highlightText
                                .replaceAll('\n', ' ')
                                .replaceAll(/[^\w\s.:?!]/g, ' ')
                                .replaceAll('  ', ' ')
                                .trim()
                            const response = await this.props.summarizeBG.getTextSummary(
                                textToSummarize,
                                prompt.prompt,
                            )
                            return response
                        }}
                        highlightText={this.state.highlightText}
                    />
                )
        }
    }

    render() {
        const { showTooltip, position, tooltipState } = this.state
        const pos = { ...position }
        return (
            <ContainerBox
                style={{
                    left:
                        this.state.tooltipState === 'AIinterface'
                            ? pos.x + 30
                            : pos.x - 112,
                    top: pos.y + 30,
                }}
                className="memex-tooltip-container"
                screenPosition={
                    this.state.tooltipState === 'AIinterface'
                        ? 'fixed'
                        : 'absolute'
                }
            >
                {showTooltip ? (
                    <PopoutBox
                        closeComponent={() => {
                            !this.state.preventClosing &&
                                (this.state.removeAfterUse
                                    ? this.props.inPageUI.removeTooltip()
                                    : this.props.inPageUI.hideTooltip())
                        }}
                        placement="bottom"
                        strategy="absolute"
                        noStyles
                    >
                        <Container
                            id="memex-tooltip-container"
                            onDragStart={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                            onDragFinish={(e, d) => {
                                this.setState({
                                    position: {
                                        x: e.x,
                                        y: e.y,
                                    },
                                })
                            }}
                            enableResizing={false}
                            cancel=".noDrag"
                        >
                            {this.renderTooltipComponent()}
                        </Container>
                    </PopoutBox>
                ) : null}
            </ContainerBox>
        )
    }
}

export default TooltipContainer

const ContainerBox = styled.div<{ screenPosition }>`
    position: ${(props) => props.screenPosition};
    width: 224px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
`
const openAnimation = keyframes`
 0% { zoom: 0.8; opacity: 0 }
 80% { zoom: 1.05; opacity: 0.8 }
 100% { zoom: 1; opacity: 1 }`

const Container = styled(Rnd)`
    z-index: 100000;
    border: 1px solid ${(props) => props.theme.colors.greyScale3};
    animation-duration: 0.1s;
    animation: ${openAnimation} cubic-bezier(0.4, 0, 0.16, 0.87);
    background: ${(props) => props.theme.colors.greyScale1};
    box-shadow: 0px 22px 26px 18px rgba(0, 0, 0, 0.03);
    border-radius: 8px;
`
