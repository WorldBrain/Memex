import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { LoadingIndicator, ToggleSwitch } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import NotificationList from './components/NotificationList'
import Notification from './components/Notification'
import ReadHeader from './components/ReadHeader'
import ActionButton from './components/ActionButton'
import { actionRegistry } from './registry'
import OptIn from './components/OptIn'
import * as actionTypes from './action-types'
import NoNotification from './components/NoNotification'
import { remoteFunction } from 'src/util/webextensionRPC'
import { EVENT_NAMES } from '../analytics/internal/constants'

const processEvent = remoteFunction('processEvent')

type Notification = any

export type Props = OwnProps & DispatchProps & StateProps

export interface OwnProps {
    messageCharLimit?: number
    tabs?: Tabs.Static
}

export interface DispatchProps {
    handleToggleShowMore: (id?: number) => void
    handleTick: (notif: Notification) => void
    toggleReadExpand: () => void
    onBottomReached: () => void
    init: () => void
}

export interface StateProps {
    unreadNotificationList: Notification[]
    readNotificationList: Notification[]
    isReadExpanded: boolean
    needsWaypoint: boolean
    isLoadingBar: boolean
    isReadShow: boolean
    isLoading: boolean
    localStorageNotif: any
    showMoreIndex: string
}

class NotificationContainer extends Component<Props> {
    static defaultProps: OwnProps = {
        messageCharLimit: 250,
        tabs: browser.tabs,
    }

    componentDidMount() {
        this.props.init()
    }

    isNotificationTruncated(message) {
        return message.length > this.props.messageCharLimit
    }

    truncateText(message) {
        const lastSpaceBeforeCutoff = message.lastIndexOf(
            ' ',
            this.props.messageCharLimit,
        )
        const trunctatedText = message.substr(0, lastSpaceBeforeCutoff) + '...'
        return trunctatedText
    }

    handleToggleStorageOption(action, value, id) {
        processEvent({
            type: EVENT_NAMES.CLICK_STORAGE_CHANGE_NOTIF_BUTTON,
            details: {
                notificationId: id,
            },
        })

        action = {
            ...action,
            value,
        }

        actionRegistry[action.type]({
            definition: action,
        })
    }

    handleOpenNewTab(url, id) {
        processEvent({
            type: EVENT_NAMES.CLICK_OPEN_NEW_LINK_BUTTON,
            details: {
                notificationId: id,
            },
        })

        this.props.tabs.create({
            url,
        })
    }

    renderButtons(buttons, id) {
        const { localStorageNotif } = this.props

        if (!buttons) {
            return null
        }

        return buttons.map((button, i) => {
            const { action } = button

            if (action.type === actionTypes.OPEN_URL) {
                return (
                    <ActionButton
                        key={i}
                        handleClick={() =>
                            this.handleOpenNewTab(action.url, id)
                        }
                    >
                        {button.label}
                    </ActionButton>
                )
            } else if (action.type === actionTypes.TOGGLE_SETTING) {
                return (
                    <OptIn key={i} label={button.label}>
                        <ToggleSwitch
                            defaultValue={localStorageNotif[action.key]}
                            onChange={val =>
                                this.handleToggleStorageOption(action, val, id)
                            }
                        />{' '}
                    </OptIn>
                )
            } else {
                return (
                    <ActionButton
                        key={i}
                        handleClick={actionRegistry[action.type]({
                            definition: action,
                        })}
                    >
                        {button.label}
                    </ActionButton>
                )
            }
        })
    }

    renderNotificationItems(notifications, isUnread) {
        const { showMoreIndex, handleToggleShowMore, handleTick } = this.props

        return notifications.map((notification, i) => {
            const isTruncated = this.isNotificationTruncated(
                notification.message,
            )

            const trucatedMessage =
                isTruncated && showMoreIndex !== notification.id
                    ? this.truncateText(notification.message)
                    : notification.message

            return (
                <Notification
                    key={i}
                    title={notification.title}
                    message={trucatedMessage}
                    buttonText={notification.buttons}
                    date={notification.date}
                    isShowMore={isTruncated}
                    showMore={handleToggleShowMore(
                        showMoreIndex === notification.id
                            ? undefined
                            : notification.id,
                    )}
                    isMore={showMoreIndex !== notification.id}
                    handleTick={handleTick(notification)}
                    isUnread={isUnread}
                    buttons={this.renderButtons(
                        notification.buttons,
                        notification.id,
                    )}
                />
            )
        })
    }

    renderReadNotifications() {
        const { readNotificationList, isReadShow } = this.props
        if (!isReadShow) {
            return
        }

        const notificationResults = this.renderNotificationItems(
            readNotificationList,
            false,
        )

        // Insert waypoint at the end of results to trigger loading new items when
        // scrolling down
        if (this.props.needsWaypoint) {
            notificationResults.push(
                <Waypoint
                    onEnter={this.props.onBottomReached}
                    key="waypoint"
                />,
            )
        }

        if (this.props.isLoading) {
            notificationResults.push(<LoadingIndicator key="loading" />)
        }

        return notificationResults
    }

    renderUnreadNotifications() {
        const { unreadNotificationList } = this.props

        return this.renderNotificationItems(unreadNotificationList, true)
    }

    renderStatusHeading() {
        const { unreadNotificationList } = this.props

        if (this.props.isLoadingBar) {
            return <LoadingIndicator key="loading" />
        } else {
            return unreadNotificationList.length === 0 ? (
                <NoNotification title="No new notifications">
                    ¯\_(ツ)_/¯
                </NoNotification>
            ) : null
        }
    }

    render() {
        const { readNotificationList } = this.props

        return (
            <NotificationList>
                {' '}
                {this.renderStatusHeading()} {this.renderUnreadNotifications()}{' '}
                {readNotificationList.length !== 0 && (
                    <ReadHeader
                        isReadExpanded={this.props.isReadExpanded}
                        toggleReadExpand={this.props.toggleReadExpand}
                    />
                )}{' '}
                {this.renderReadNotifications()}{' '}
            </NotificationList>
        )
    }
}

const mapStateToProps = state => ({
    readNotificationList: selectors.readNotificationList(state),
    unreadNotificationList: selectors.unreadNotificationList(state),
    showMoreIndex: selectors.showMoreIndex(state),
    isLoading: selectors.isLoading(state),
    needsWaypoint: selectors.needsWaypoint(state),
    isReadExpanded: selectors.isReadExpanded(state),
    isReadShow: selectors.isReadShow(state),
    localStorageNotif: selectors.localStorageNotif(state),
    isLoadingBar: selectors.isLoadingBar(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            init: actions.init,
            onBottomReached: actions.getMoreNotifications,
            toggleReadExpand: actions.toggleReadExpand,
        },
        dispatch,
    ),
    handleToggleShowMore: index => event => {
        event.preventDefault()
        dispatch((actions.setShowMoreIndex as any)(index))
    },
    handleTick: notification => event => {
        event.preventDefault()
        dispatch(actions.handleReadNotif(notification))
    },
})

export default connect<StateProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationContainer)
