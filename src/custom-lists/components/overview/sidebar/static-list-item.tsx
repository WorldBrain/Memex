import React, { Component, MouseEventHandler, HTMLProps } from 'react'
import cx from 'classnames'

export interface Props extends HTMLProps<HTMLDivElement> {
    listName: string
    isFiltered?: boolean
    unreadCount?: number
    onListItemClick: MouseEventHandler<HTMLDivElement>
}

export class StaticListItem extends Component<Props> {
    render() {
        return (
            <div
                onClick={this.props.onListItemClick}
                title={this.props.listName}
            >
                <div>{this.props.listName}</div>
                {this.props.listName === 'Inbox' && (
                    <span>{this.props.unreadCount}</span>
                )}
                {this.props.listName === 'Feed' && <span />}
            </div>
        )
    }
}
