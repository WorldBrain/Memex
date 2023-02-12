import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import React, { PureComponent, MouseEventHandler } from 'react'
const pageStyles = require('./result-item.css')

export interface Props {
    crossIconSrc?: string
    onClick: MouseEventHandler<HTMLDivElement>
}

class SemiCircularRibbon extends PureComponent<Props> {
    render() {
        return (
            <TooltipBox tooltipText="Remove from collection" placement="bottom">
                <div className={pageStyles.button} onClick={this.props.onClick}>
                    <img src={'/img/removing.svg'} className={pageStyles.img} />
                </div>
            </TooltipBox>
        )
    }
}

export default SemiCircularRibbon
