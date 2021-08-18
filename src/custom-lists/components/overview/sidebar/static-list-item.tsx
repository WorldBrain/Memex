import React, { Component, MouseEventHandler, HTMLProps } from 'react'
import cx from 'classnames'

const styles = require('./list-item.css')

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
                className={cx(styles.pageList, {
                    [styles.filtered]: this.props.isFiltered,
                })}
                onClick={this.props.onListItemClick}
                title={this.props.listName}
            >
                <div className={styles.listName}>{this.props.listName}</div>
                {this.props.listName === 'Inbox' && (
                    <span className={styles.unreadCount}>
                        {this.props.unreadCount}
                    </span>
                )}
            </div>
        )
    }
}
