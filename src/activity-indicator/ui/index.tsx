import React from 'react'
import styled, { css } from 'styled-components'
import { StatefulUIElement } from 'src/util/ui-logic'
import { StaticListItem } from 'src/custom-lists/components/overview/sidebar/static-list-item'
import Logic, { Dependencies, State, Events } from './logic'

export interface Props extends Dependencies {
    noRing?: boolean
    itemRef?: React.RefObject<HTMLDivElement>
}

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
                <div>
                    <StaticListItem
                        listName="Feed"
                        unreadCount={this.state.hasFeedActivity ? 1 : 0}
                        onListItemClick={this.handleFeedIndicatorClick}
                    />
                </div>
            )
        }

        return null
    }
}

export class FeedActivityDot extends StatefulUIElement<Props, State, Events> {
    constructor(props: Props) {
        super(props, new Logic(props))
    }

    private handleFeedIndicatorClick: React.MouseEventHandler = (e) => {
        this.processEvent('clickFeedEntry', null)
        this.props.clickedOn()
    }

    render() {
        if (this.state.isShown) {
            if (this.state.hasFeedActivity) {
                return (
                    <OuterRing
                        ref={this.props.itemRef}
                        noRing={this.props.noRing}
                    >
                        <Dot onClick={this.handleFeedIndicatorClick} />
                    </OuterRing>
                )
            } else {
                return <OuterRing noRing={this.props.noRing} />
            }
        }

        return null
    }
}

const OuterRing = styled.div<{
    noRing?: boolean
}>`
    width: 14px;
    height: 14px;
    border: 2px solid ${(props) => props.theme.colors.greyScale4};
    cursor: pointer;
    border-radius: 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    ${(props) =>
        props.noRing &&
        css`
            border: none;
        `};
`

const Dot = styled.div`
    border-radius: 10px;
    width: 10px;
    height: 10px;
    background: ${(props) => props.theme.colors.prime1};
    cursor: pointer;
`
