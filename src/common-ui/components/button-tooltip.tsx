import * as React from 'react'
import styled from 'styled-components'

export type TooltipPosition =
    | 'left'
    | 'leftNarrow'
    | 'leftBig'
    | 'right'
    | 'rightCentered'
    | 'rightContentTooltip'
    | 'top'
    | 'bottom'
    | 'bottomRightEdge'
    | 'popupLeft'

export interface Props {
    tooltipText: string
    position: TooltipPosition
}

interface State {
    displayTooltip: boolean
}

class ButtonTooltip extends React.Component<Props, State> {
    private tooltipRef = React.createRef<HTMLDivElement>()

    state: State = { displayTooltip: false }

    componentDidMount() {
        this.tooltipRef.current.addEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.tooltipRef.current.addEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    componentWillUnmount() {
        this.tooltipRef.current.removeEventListener(
            'mouseenter',
            this.handleMouseEnter,
        )
        this.tooltipRef.current.removeEventListener(
            'mouseleave',
            this.handleMouseLeave,
        )
    }

    private handleMouseEnter = () => this.setState({ displayTooltip: true })
    private handleMouseLeave = () => this.setState({ displayTooltip: false })

    render() {
        const { tooltipText, position, children } = this.props

        return (
            <Container ref={this.tooltipRef} position={position}>
                {this.state.displayTooltip && (
                    <TooltipBubble position={position}>
                        <TooltipText>{tooltipText}</TooltipText>
                    </TooltipBubble>
                )}

                {children}
            </Container>
        )
    }
}

export default ButtonTooltip

const determineContainerStyles = ({ position }: Props) => {
    switch (position) {
        case 'top':
            return `
            align-items: center;
        `
        case 'bottom':
            return `
            justify-content: center;
            align-items: center;
            height: 100%;
            width: auto;
        `
        default:
            return ''
    }
}

const determineBubbleStyles = ({ position }: Props) => {
    switch (position) {
        case 'left':
            return `
            justify-content: flex-end;
            right: 40px;
            align-items: center;
        `
        case 'leftNarrow':
            return `
            justify-content: flex-end;
            right: 35px;
        `
        case 'leftBig':
            return `
            justify-content: flex-end;
            right: 60px;
            flex-wrap: wrap;
            width: 150px;
        `
        case 'right':
            return `
            margin-left: 40px;
            margin-top: 2px;
        `
        case 'rightCentered':
            return `
            left: 40px;
            justify-content: flex-start;
        `
        case 'bottom':
            return `
            transform: translateY(30px);
            justify-content: center;
            align-items: flex-start;
            z-index: 250000;
        `
        case 'top':
            return `
            transform: translateY(-40px);
            justify-content: center;
            align-items: center;
            z-index: 250000;
        `
        case 'rightContentTooltip':
            return `
            justify-content: flex-start;
            left: 30px;
            top: -10px;
        `
        case 'popupLeft':
            return `
            justify-content: flex-end;
            right: 50px;
            align-items: center;
        `
        case 'bottomRightEdge':
            return `
            transform: translate(-60px, 30px);
            justify-content: center;
            align-items: flex-start;
            z-index: 250000;
        `
        default:
            return ''
    }
}

const Container = styled.div`
    display: inline-flex;
    align-items: center;
    position: relative;
    z-index: 2 ${determineContainerStyles};
`

const TooltipBubble = styled.div`
    position: absolute;
    height: 18px;
    border-radius: 5px;
    display: flex;
    flex-wrap: nowrap;
    min-width: max-content;
    align-items: center;
    font-family: 'Poppins', sans-serif;

    ${determineBubbleStyles}
`

const TooltipText = styled.div`
    background: #3a2f46; /* grey 9 */
    border-radius: 3px;
    color: white;
    font-size: 11px;
    font-weight: 500;
    max-width: 160px;
    line-height: 1.4;
    padding: 0.5em 1em;
    text-align: center;
    width: fit-content;
    font-family: 'Poppins', sans-serif;
`
