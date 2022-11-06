import React from 'react'
import styled from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import { StaticListItem } from 'src/custom-lists/components/overview/sidebar/static-list-item'
import Logic, { Dependencies, State, Events } from './logic'

export interface Props extends Dependencies {}

export default class FeedActivityIndicator extends StatefulUIElement<
    Props,
    State,
    Events
> {
    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private handleFeedIndicatorClick: React.MouseEventHandler = (e) =>
        this.processEvent('clickFeedEntry', null)

    render() {
        if (this.state.isShown) {
            return (
                <StaticListItem
                    listName="Feed"
                    unreadCount={this.state.hasFeedActivity ? 1 : 0}
                    onListItemClick={this.handleFeedIndicatorClick}
                />
            )
        }

        return null
    }
}

export class FeedActivityDot extends StatefulUIElement<Props, State, Events> {
    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private handleFeedIndicatorClick: React.MouseEventHandler = (e) =>
        this.processEvent('clickFeedEntry', null)

    render() {
        if (this.state.isShown) {
            if (this.state.hasFeedActivity) {
                return (
                    <OuterRing>
                        <Dot
                            unread={this.state.hasFeedActivity ? 1 : 0}
                            // onClick={this.handleFeedIndicatorClick}
                        />
                    </OuterRing>
                )
            } else {
                return <OuterRing />
            }
        }

        return null
    }
}

const OuterRing = styled.div`
    width: 14px;
    height: 14px;
    border: 2px solid ${(props) => props.theme.colors.iconColor};
    cursor: pointer;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const Dot = styled.div<{ unread: boolean }>`
    border-radius: 10px;
    width: 10px;
    height: 10px;
    background: ${(props) => props.theme.colors.purple};
    cursor: pointer;
`
