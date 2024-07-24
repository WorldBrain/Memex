import React from 'react'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import type { ListTreeState, ListTreeActions } from '../types'

export interface Props {
    getRootElement?: () => HTMLElement
    treeState: ListTreeState
    actions: ListTreeActions
}

export class ListTreeToggleArrow extends React.Component<Props> {
    private toggleBtnRef = React.createRef<HTMLDivElement>()

    render() {
        const { treeState, actions } = this.props
        return (
            <TooltipBox
                tooltipText={
                    !treeState.hasChildren
                        ? 'Add Sub-Space'
                        : treeState.areChildrenShown
                        ? 'Hide Sub-Spaces'
                        : 'Show Sub-Spaces'
                }
                placement="bottom"
                targetElementRef={this.toggleBtnRef.current}
                getPortalRoot={this.props.getRootElement}
                hideTooltip={treeState.hasChildren}
            >
                <Icon
                    containerRef={this.toggleBtnRef}
                    icon={
                        !treeState.hasChildren
                            ? 'plus'
                            : treeState.areChildrenShown
                            ? 'arrowDown'
                            : 'arrowRight'
                    }
                    heightAndWidth="16px"
                    color={treeState.hasChildren ? 'greyScale5' : 'greyScale3'}
                    onClick={(event) => {
                        if (treeState.hasChildren) {
                            actions.toggleShowChildren()
                        } else {
                            actions.toggleShowNewChildInput()
                        }

                        event.stopPropagation()
                    }}
                />
            </TooltipBox>
        )
    }
}
