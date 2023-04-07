import React from 'react'
import styled, { keyframes } from 'styled-components'

import type {
    AnnotationFunctions,
    TooltipPosition,
} from 'src/in-page-ui/tooltip/types'
import { Rnd } from 'react-rnd'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { Tooltip } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/tooltip'
import type { TooltipKBShortcuts } from '@worldbrain/memex-common/lib/in-page-ui/tooltip/types'

export interface Props extends AnnotationFunctions {
    getKBShortcuts: () => Promise<TooltipKBShortcuts>
    onExternalDestroy?: (cb: () => void) => void
    onTooltipClose?: () => Promise<void>
    onTooltipHide?: () => Promise<void>
    onTooltipInit?: (cb: () => void) => void
}

interface TooltipContainerState {
    position: { x: number; y: number } | null
    keyboardShortcuts?: TooltipKBShortcuts
    showTooltip: boolean
    preventClosing: boolean
}

class TooltipContainer extends React.Component<Props, TooltipContainerState> {
    state: TooltipContainerState = {
        position: null,
        showTooltip: false,
        preventClosing: true,
    }

    async componentDidMount() {
        this.props.onTooltipInit?.(this.showTooltip)
        this.props.onExternalDestroy?.(() =>
            this.setState({ showTooltip: false, position: null }),
        )

        if (this.props.getKBShortcuts) {
            const keyboardShortcuts = await this.props.getKBShortcuts()
            this.setState({ keyboardShortcuts })
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
        if (!this.state.showTooltip) {
            this.setState({
                preventClosing: true,
            })

            setTimeout(() => {
                this.setState({
                    showTooltip: true,
                    preventClosing: true,
                    position: this.calculateTooltipPostion(),
                })
            }, 200)
            setTimeout(() => {
                this.setState({
                    preventClosing: false,
                })
            }, 400)
        }
    }

    private closeTooltip: React.MouseEventHandler = async (event) => {
        event.preventDefault()
        event.stopPropagation()

        this.setState({ showTooltip: false })
        await this.props.onTooltipClose?.()
    }

    private hideTooltip = async () => {
        this.setState({ showTooltip: false })
        await this.props.onTooltipHide?.()
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
            await this.hideTooltip()
        }
    }

    private createHighlight: React.MouseEventHandler = async (e) => {
        try {
            await this.props.createHighlight(e.shiftKey)
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            await this.hideTooltip()
        }
    }

    private addToSpace: React.MouseEventHandler = async (e) => {
        try {
            await this.props.createAnnotation(false, true)
        } catch (err) {
            throw err
        } finally {
            window.getSelection().empty()
            await this.hideTooltip()
        }
    }

    private openAIInterface: React.MouseEventHandler = async (e) => {
        const highlightText = window.getSelection().toString() ?? ''
        await Promise.all([this.hideTooltip(), this.props.askAI(highlightText)])
    }

    render() {
        const { showTooltip, position, keyboardShortcuts } = this.state
        return (
            <ContainerBox
                style={
                    position != null
                        ? { top: position.y + 30, left: position.x - 112 }
                        : {}
                }
                className="memex-tooltip-container"
                screenPosition="absolute"
            >
                {showTooltip ? (
                    <PopoutBox
                        closeComponent={async () => {
                            if (!this.state.preventClosing) {
                                await this.hideTooltip()
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
                                    position: { x: e.x, y: e.y },
                                })
                            }}
                            enableResizing={false}
                            cancel=".noDrag"
                        >
                            <Tooltip
                                keyboardShortcuts={keyboardShortcuts}
                                createAnnotation={this.createAnnotation}
                                createHighlight={this.createHighlight}
                                openAIInterface={this.openAIInterface}
                                closeTooltip={this.closeTooltip}
                                addToSpace={this.addToSpace}
                            />
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
