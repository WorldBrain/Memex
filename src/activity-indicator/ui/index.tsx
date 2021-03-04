import React from 'react'

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
        console.log(this.state.isShown)

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
