import React, { PureComponent, MouseEventHandler } from 'react'
import cx from 'classnames'

import { Tooltip as TooltipType } from '../../types'

const styles = require('./Tooltip.css')

export interface Props {
    tooltip: TooltipType
    showTooltip: boolean
    scrollDisabled: boolean
    isTooltipRenderable: boolean
    toggleShowTooltip: MouseEventHandler
    fetchNextTooltip: MouseEventHandler
}

class Tooltip extends PureComponent<Props> {
    get tooltipBtnClass() {
        return cx({
            [styles.tooltipButtonIcon]: this.props.showTooltip,
        })
    }

    get mainContainerClass() {
        return cx(styles.mainTooltip, {
            [styles.isActive]: this.props.showTooltip,
            [styles.counterMargin]: this.props.scrollDisabled,
        })
    }

    render() {
        return (
            <div className={this.mainContainerClass}>
                <div className={styles.tooltipButton}>
                    <div
                        className={this.tooltipBtnClass}
                        onClick={this.props.toggleShowTooltip}
                    >
                        {!this.props.showTooltip && 'Show Tips'}
                    </div>
                    {this.props.showTooltip && (
                        <div
                            className={styles.refreshIcon}
                            onClick={this.props.fetchNextTooltip}
                            title="Next Tip"
                        />
                    )}
                </div>
                {this.props.isTooltipRenderable && (
                    <div className={styles.tooltipText}>
                        <div className={styles.tooltipTitle}>
                            {this.props.tooltip.title}
                        </div>
                        <div
                            className={styles.tooltipDesc}
                            dangerouslySetInnerHTML={{
                                __html: this.props.tooltip.description,
                            }}
                        />
                    </div>
                )}
            </div>
        )
    }
}

export default Tooltip
