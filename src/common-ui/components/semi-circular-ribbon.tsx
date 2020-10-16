import React, { PureComponent, MouseEventHandler } from 'react'
import ButtonTooltip from './button-tooltip'

const styles = require('./semi-circular-ribbon.css')
const pageStyles = require('./result-item.css')

export interface Props {
    crossIconSrc?: string
    onClick: MouseEventHandler
}

class SemiCircularRibbon extends PureComponent<Props> {
    render() {
        return (
            <ButtonTooltip
                tooltipText="Remove from collection"
                position="bottom"
            >
                <div className={pageStyles.button} onClick={this.props.onClick}>
                    <img src={'/img/removing.svg'} className={pageStyles.img} />
                </div>
            </ButtonTooltip>
        )
    }
}

export default SemiCircularRibbon
