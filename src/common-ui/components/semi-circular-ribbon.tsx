import React, { PureComponent, MouseEventHandler } from 'react'
import ButtonTooltip from './button-tooltip'

const styles = require('./semi-circular-ribbon.css')
const pageStyles = require('./result-item.css')

export interface Props {
    crossIconSrc?: string
    title?: string
    onClick: MouseEventHandler<HTMLDivElement>
}

class SemiCircularRibbon extends PureComponent<Props> {
    static defaultProps = {
        title: 'Remove from this collection',
        crossIconSrc: '/img/cross_grey.svg',
    }

    render() {
        return (
            <ButtonTooltip
                tooltipText="Remove from collection"
                position="leftNarrow"
            >
                <div className={pageStyles.crossRibbon}>
                    <div
                        title={this.props.title}
                        className={styles.ribbon}
                        onClick={this.props.onClick}
                    />
                </div>
            </ButtonTooltip>
        )
    }
}

export default SemiCircularRibbon
