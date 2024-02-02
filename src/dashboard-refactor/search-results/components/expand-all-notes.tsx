import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

import colors from 'src/dashboard-refactor/colors'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'

export interface Props {
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    isEnabled?: boolean
    getRootElement: () => HTMLElement
}

export default class ExpandAllNotes extends PureComponent<Props> {
    private get btnText(): string {
        return this.props.isEnabled ? 'Collapse Notes' : 'Expand Notes'
    }

    render() {
        return !this.props.isEnabled || this.props.isEnabled == null ? (
            <TooltipBox
                tooltipText="Expand all annotations"
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    filePath={icons.expand}
                    heightAndWidth="24px"
                    onClick={this.props.onClick}
                    padding={'5px'}
                />
            </TooltipBox>
        ) : (
            <TooltipBox
                tooltipText="Collapse all annotations"
                placement="bottom"
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    filePath={icons.compress}
                    heightAndWidth="24px"
                    onClick={this.props.onClick}
                    padding={'5px'}
                />
            </TooltipBox>
        )
    }
}
