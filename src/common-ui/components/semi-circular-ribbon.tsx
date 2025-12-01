import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'
import React, { PureComponent, MouseEventHandler } from 'react'

export interface Props {
    crossIconSrc?: string
    onClick: MouseEventHandler<HTMLDivElement>
}

class SemiCircularRibbon extends PureComponent<Props> {
    render() {
        return (
            <TooltipBox
                getPortalRoot={null}
                tooltipText="Remove from collection"
                placement="bottom"
            >
                <div className="button" onClick={this.props.onClick}>
                    <img src={'/img/removing.svg'} className="img" />
                </div>
            </TooltipBox>
        )
    }
}

export default SemiCircularRibbon
