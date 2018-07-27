import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import { LoadingIndicator, ToggleSwitch } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import NotificationList from './components/NotificationList'
import Notification from './components/Notification'
import StatusHeading from './components/StatusHeading'
import ReadHeader from './components/ReadHeader'
import OpenLinkButton from './components/OpenLinkButton'
import ActionButton from './components/ActionButton'
import { actionRegistry } from './registry'
import OptIn from './components/OptIn'

class NotificationContainer extends Component {
    static propTypes = {
        unreadNotificationList: PropTypes.arrayOf(PropTypes.object).isRequired,
        readNotificationList: PropTypes.object.isRequired,
        init: PropTypes.func.isRequired,
        showMoreIndex: PropTypes.string,
        handleToggleShowMore: PropTypes.func.isRequired,
        handleTick: PropTypes.func.isRequired,
        onBottomReached: PropTypes.func.isRequired,
        isLoading: PropTypes.bool.isRequired,
        needsWaypoint: PropTypes.bool.isRequired,
        isReadExpanded: PropTypes.bool.isRequired,
        toggleReadExpand: PropTypes.func.isRequired,
        isReadShow: PropTypes.bool.isRequired,
        messageCharLimit: PropTypes.number.isRequired,
        shouldTrack: PropTypes.bool.isRequired,
        setShouldTrack: PropTypes.func.isRequired,
    }

    static defaultProps = {
        messageCharLimit: 150,
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

    handleToggleStorageOption(action) {
        const { shouldTrack } = this.props

        action = {
            ...action,
            value: !shouldTrack,
        }

        this.props.setShouldTrack(!shouldTrack)
        actionRegistry[action.type]({
            definition: action,
        })
    }

    renderButtons(buttons) {
        const { shouldTrack } = this.props

        if (!buttons) {
            return null
        }

        return buttons.map((button, i) => {
            const { action } = button

            if (action.type === 'go-to-url') {
                return (
                    <OpenLinkButton
                        key={i}
                        url={action.url}
                        label={button.label}
                        context={action.context}
                    />
                )
            } else if (action.type === 'toggle-storage-option') {
                return (
                    <OptIn key={i}>
                        <ToggleSwitch
                            isChecked={shouldTrack}
                            onChange={() =>
                                this.handleToggleStorageOption(action)
                            }
                        />
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
                    buttons={this.renderButtons(notification.buttons)}
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
            readNotificationList.notifications,
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

    render() {
        const { unreadNotificationList, readNotificationList } = this.props

        return (
            <NotificationList>
                <StatusHeading>
                    {unreadNotificationList.length === 0
                        ? 'There are no new notification.'
                        : 'New'}
                </StatusHeading>
                {this.renderUnreadNotifications()}
                {readNotificationList.notifications.length !== 0 && (
                    <ReadHeader
                        isReadExpanded={this.props.isReadExpanded}
                        toggleReadExpand={this.props.toggleReadExpand}
                    />
                )}
                {this.renderReadNotifications()}
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
    shouldTrack: selectors.shouldTrack(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            init: actions.init,
            onBottomReached: actions.getMoreNotifications,
            toggleReadExpand: actions.toggleReadExpand,
            setShouldTrack: actions.setShouldTrack,
        },
        dispatch,
    ),
    handleToggleShowMore: index => event => {
        event.preventDefault()
        dispatch(actions.setShowMoreIndex(index))
    },
    handleTick: notification => event => {
        event.preventDefault()
        dispatch(actions.handleReadNotif(notification))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationContainer)
