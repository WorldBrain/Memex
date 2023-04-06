import React from 'react'
import styled, { keyframes } from 'styled-components'

import type { SharedInPageUIEvents } from 'src/in-page-ui/shared-state/types'
import type {
    TooltipInPageUIInterface,
    AnnotationFunctions,
    TooltipPosition,
} from 'src/in-page-ui/tooltip/types'
import AIInterfaceForTooltip from './aIinterfaceComponent'
import type { SummarizationInterface } from 'src/summarization-llm/background'
import { Rnd } from 'react-rnd'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { Tooltip } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/tooltip'
import type { TooltipKBShortcuts } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/types'

export interface Props extends AnnotationFunctions {
    getKBShortcuts: () => Promise<TooltipKBShortcuts>
    summarizeBG: SummarizationInterface<'caller'>
    inPageUI: TooltipInPageUIInterface
    destroyTooltip: any
    onInit: any
}

interface TooltipContainerState {
    position: { x: number; y: number } | {}
    tooltipState: 'copied' | 'running' | 'pristine' | 'done' | 'AIinterface'
    keyboardShortcuts?: TooltipKBShortcuts
    highlightText: string
    showTooltip: boolean
    preventClosing: boolean
}

class TooltipContainer extends React.Component<Props, TooltipContainerState> {
    state: TooltipContainerState = {
        position: {},
        tooltipState: 'copied',
        highlightText: '',
        showTooltip: false,
        preventClosing: true,
    }

    async componentDidMount() {
        this.props.inPageUI.events?.on('stateChanged', this.handleUIStateChange)
        this.props.onInit(this.showTooltip)
        if (this.props.getKBShortcuts) {
            const keyboardShortcuts = await this.props.getKBShortcuts()
            this.setState({ keyboardShortcuts })
        }
    }

    componentWillUnmount() {
        this.props.inPageUI.events?.removeListener(
            'stateChanged',
            this.handleUIStateChange,
        )
    }

    private handleUIStateChange: SharedInPageUIEvents['stateChanged'] = (
        event,
    ) => {
        if (!('tooltip' in event.changes)) {
            return
        }

        if (!event.newState.tooltip) {
            this.setState({
                showTooltip: false,
                position: {},
            })
        }
    }

    private calculateTooltipPostion(): TooltipPosition {
        const range = document.getSelection().getRangeAt(0)
        const boundingRect = range.getBoundingClientRect()
        // x = position of element from the left + half of it's width
        const x = boundingRect.left + boundingRect.width / 2
        // y = scroll height from top + pixels from top + height of element - offset
        const y =
            window.pageYOffset + boundingRect.top + boundingRect.height - 20
        return {
            x,
            y,
        }
    }

    private showTooltip = () => {
        if (!this.state.showTooltip && this.state.tooltipState !== 'running') {
            this.setState({
                preventClosing: true,
            })

            setTimeout(() => {
                this.setState({
                    showTooltip: true,
                    position: this.calculateTooltipPostion(),
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

    private closeTooltip: React.MouseEventHandler = (event) => {
        event.preventDefault()
        event.stopPropagation()

        this.props.inPageUI.removeTooltip()
    }

    private createAnnotation: React.MouseEventHandler = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            await this.props.createAnnotation(e.shiftKey)
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

    private addToSpace: React.MouseEventHandler = async (e) => {
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
    private openAIInterface: React.MouseEventHandler = async (e) => {
        this.setState({
            highlightText: window.getSelection().toString() ?? '',
        })
        this.props.inPageUI.hideTooltip()
        await this.props.inPageUI.showSidebar({
            action: 'show_page_summary',
            highlightedText: this.state.highlightText,
        })
    }

    private renderTooltipComponent = () => {
        switch (this.state.tooltipState) {
            case 'pristine':
                if (this.state.keyboardShortcuts != null) {
                    return (
                        <Tooltip
                            keyboardShortcuts={this.state.keyboardShortcuts}
                            createAnnotation={this.createAnnotation}
                            createHighlight={this.createHighlight}
                            openAIInterface={this.openAIInterface}
                            closeTooltip={this.closeTooltip}
                            addToSpace={this.addToSpace}
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
                            const response = await this.props.summarizeBG.startPageSummaryStream(
                                {
                                    textToProcess: textToSummarize,
                                    queryPrompt: prompt.prompt,
                                },
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
                        closeComponent={async () => {
                            if (!this.state.preventClosing) {
                                await this.props.inPageUI.hideTooltip()
                            }
                        }}
                        placement="bottom"
                        strategy="absolute"
                        noStyles
                        instaClose
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

const ContainerBox = styled.div<{ screenPosition: string }>`
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
