import * as React from 'react'
import cx from 'classnames'

const styles = require('./button-tooltip.css')

interface Props {
    children: React.ReactNode
    tooltipText: string
    position: string
}

interface State {
    displayTooltip: boolean
}

class ButtonTooltip extends React.Component<Props, State> {
    private tooltipRef: HTMLElement

    private setTooltipRef = (ref: HTMLElement) => {
        this.tooltipRef = ref
    }

    state: State = {
        displayTooltip: false,
    }

    componentDidMount() {
        this.tooltipRef.addEventListener('mouseenter', this.handleMouseEnter)
        this.tooltipRef.addEventListener('mouseleave', this.handleMouseLeave)
    }

    componentWillUnmount() {
        this.tooltipRef.removeEventListener('mouseenter', this.handleMouseEnter)
        this.tooltipRef.removeEventListener('mouseleave', this.handleMouseLeave)
    }

    handleMouseEnter = () => {
        this.setState({
            displayTooltip: true,
        })
    }

    handleMouseLeave = () => {
        this.setState({
            displayTooltip: false,
        })
    }

    render() {
        const { tooltipText, position } = this.props

        return (
            <div
                ref={this.setTooltipRef}
                className={cx(styles.tooltipContainer, {
                    [styles.tooltipContainerBottom]:
                        this.props.position === 'bottom',
                    [styles.tooltipContainerCenterCenter]:
                        this.props.position === 'CenterCenter',
                })}
            >
                {this.state.displayTooltip && (
                    <div
                        className={cx(styles.tooltipBubble, {
                            [styles.tooltipLeft]:
                                this.props.position === 'left',
                            [styles.tooltipLeftNarrow]:
                                this.props.position === 'leftNarrow',
                            [styles.tooltipLeftBig]:
                                this.props.position === 'leftBig',
                            [styles.tooltipRight]:
                                this.props.position === 'right',
                            [styles.tooltipRightCentered]:
                                this.props.position === 'rightCentered',
                            [styles.tooltipBottom]:
                                this.props.position === 'bottom',
                            [styles.tooltipTop]: this.props.position === 'top',
                            [styles.tooltipRightContentTooltip]:
                                this.props.position === 'rightContentTooltip',
                            [styles.tooltipCenterCenter]:
                                this.props.position === 'CenterCenter',
                            [styles.popupLeft]:
                                this.props.position === 'popupLeft',
                        })}
                    >
                        <div className={styles.tooltipMessage}>
                            {tooltipText}
                        </div>
                    </div>
                )}

                {this.props.children}
            </div>
        )
    }
}

export default ButtonTooltip
