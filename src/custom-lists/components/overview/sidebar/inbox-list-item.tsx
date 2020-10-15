import React, { Component } from 'react'

import { StaticListItem, Props } from './static-list-item'
import { collections } from 'src/util/remote-functions-background'

interface State {
    unreadCount?: number
}

export class InboxListItem extends Component<Props, State> {
    private collectionsBG = collections

    state: State = {}

    async componentDidMount() {
        const unreadCount = await this.collectionsBG.getInboxUnreadCount()
        this.setState({ unreadCount })
    }

    render() {
        return (
            <StaticListItem
                {...(this.props as any)}
                unreadCount={this.state.unreadCount}
            />
        )
    }
}
