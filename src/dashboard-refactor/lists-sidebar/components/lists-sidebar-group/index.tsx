import React, { PureComponent } from 'react'
import Margin from 'src/dashboard-refactor/components/Margin'
import { fonts } from 'src/dashboard-refactor/styleConstants'
import { Icon } from 'src/dashboard-refactor/styledComponents'
import { AddableState, ExpandableState } from 'src/dashboard-refactor/types'
import styled from 'styled-components'

import { TaskState } from 'ui-logic-core/lib/types'
import ListsSidebarItemWithMenu, {
    ListsSidebarItemWithMenuProps,
} from '../lists-sidebar-item-with-menu'

const Container = styled.div`
    width: 100%;
    position: relative;
`

const GroupHeader = styled.div`
    height: 27px;
    width: 100%;

    .inner {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between
    }

    p {
        margin: 0;
        colors: ${fonts.primary.colors.secondary}
        font-family: ${fonts.primary.name};
        font-weight: ${fonts.primary.weight.bold};
        font-size: 12px;
        line-height: 18px;
    }
`

export interface ListsSidebarGroupProps {
    hasTitle: boolean
    listsGroupTitle: string
    listsArray: Array<ListsSidebarItemsArrayObject>
    addableState: AddableState
    expandableState: ExpandableState
    taskState: TaskState
}

export interface ListsSidebarItemsArrayObject {
    listId: string
    listsSidebarItemWithMenuProps: ListsSidebarItemWithMenuProps
}

export default class ListsSidebarGroup extends PureComponent<
    ListsSidebarGroupProps
> {
    handleExpandClick = () => {
        this.props.expandableState.onExpand()
    }
    render() {
        const {
            listsGroupTitle,
            listsArray,
            expandableState: { isExpanded },
        } = this.props
        return (
            <Container>
                <GroupHeader>
                    <Margin x="5.5px">
                        <Icon
                            onClick={this.handleExpandClick}
                            plus90={isExpanded}
                            minus90={!isExpanded}
                            xy="8px"
                            path="/img/triangleSmall.svg"
                        />
                    </Margin>
                    <div className="inner">
                        <p>{listsGroupTitle}</p>
                        <Icon path="/img/plus.svg" />
                    </div>
                </GroupHeader>
                {listsArray.map((listObj, idx) => {
                    const {
                        listsSidebarItemWithMenuProps: {
                            listsSidebarItemActionsArray,
                            listsSidebarItemProps,
                            isDisplayed,
                        },
                        listId,
                    } = listObj
                    return (
                        <ListsSidebarItemWithMenu
                            key={idx}
                            listId={listId}
                            isDisplayed={isDisplayed}
                            listsSidebarItemProps={listsSidebarItemProps}
                            listsSidebarItemActionsArray={listsSidebarItemActionsArray.map(
                                (actionsObj) => {
                                    return {
                                        onClick: actionsObj.onClick(listId),
                                        ...actionsObj,
                                    }
                                },
                            )}
                        />
                    )
                })}
            </Container>
        )
    }
}
