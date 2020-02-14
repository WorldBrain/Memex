import React, { PureComponent, MouseEventHandler } from 'react'
import ButtonTooltip from './button-tooltip'

const styles = require('./semi-circular-ribbon.css')
const pageStyles = require('./result-item.css')

export interface Props {
    crossIconSrc?: string
    onClick: MouseEventHandler
}

class SemiCircularRibbon extends PureComponent<Props> {
    static defaultProps = {
        crossIconSrc: '/img/remove.svg',
    }

    render() {
        return (
            <ButtonTooltip
                tooltipText="Remove from collection"
                position="bottom"
            >
                <div className={pageStyles.button} onClick={this.props.onClick}>
                    <img
                        src={'/img/remove.svg'}
                        className={pageStyles.img}
                    />
                </div>
            </ButtonTooltip>
        )
    }
}

export default SemiCircularRibbon
