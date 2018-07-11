import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Waypoint from 'react-waypoint'

import { LoadingIndicator } from 'src/common-ui/components'
import * as actions from './actions'
import * as selectors from './selectors'
import NotificationList from './components/NotificationList'
import Notification from './components/Notification'
import StatusHeading from './components/StatusHeading'
import ReadHeader from './components/ReadHeader'

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
        const NotificationCharLimit = 150

        const lastSpaceBeforeCutoff = message.lastIndexOf(
            ' ',
            NotificationCharLimit,
        )
        const trunctatedText =
            message.substr(0, lastSpaceBeforeCutoff) + '&#8230;'
        return trunctatedText
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
                    buttonText={notification.buttonText}
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
                    link={notification.link}
                />
            )
        })
    }

    renderNotification() {
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

    render() {
        const { unreadNotificationList, readNotificationList } = this.props

        return (
            <NotificationList>
                <StatusHeading>
                    {unreadNotificationList.length === 0
                        ? 'There are no new notification.'
                        : 'New'}
                </StatusHeading>
                {this.renderNotificationItems(unreadNotificationList, true)}
                {readNotificationList.notifications.length !== 0 && (
                    <ReadHeader
                        isReadExpanded={this.props.isReadExpanded}
                        toggleReadExpand={this.props.toggleReadExpand}
                    />
                )}
                {this.renderNotification()}
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
