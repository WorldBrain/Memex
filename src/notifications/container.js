import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from './actions'
import * as selectors from './selectors'
import NotificationList from './components/NotificationList'
import Notification from './components/Notification'
import StatusHeading from './components/StatusHeading'

class NotificationContainer extends Component {
    static propTypes = {
        unreadNotificationList: PropTypes.arrayOf(PropTypes.object).isRequired,
        readNotificationList: PropTypes.arrayOf(PropTypes.object).isRequired,
        init: PropTypes.func.isRequired,
        showMoreIndex: PropTypes.string,
        handleToggleShowMore: PropTypes.func.isRequired,
        handleTick: PropTypes.func.isRequired,
    }

    componentDidMount() {
        this.props.init()
    }

    isNotificationTruncated(message) {
        const NotificationCharLimit = 150

        if (message.length <= NotificationCharLimit) {
            return false
        } else {
            return true
        }
    }

    truncateText(message) {
        const NotificationCharLimit = 150

        const lastSpaceBeforeCutoff = message.lastIndexOf(
            ' ',
            NotificationCharLimit,
        )
        const trunctatedText = message.substr(0, lastSpaceBeforeCutoff)
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
                    ? this.truncateText(notification.message) + '...'
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

    render() {
        const { unreadNotificationList, readNotificationList } = this.props

        return (
            <NotificationList>
                <StatusHeading>
                    {unreadNotificationList.length === 0
                        ? 'There is no new notification.'
                        : 'New'}
                </StatusHeading>
                {this.renderNotificationItems(unreadNotificationList, true)}
                {readNotificationList.length !== 0 && (
                    <StatusHeading>Read</StatusHeading>
                )}
                {this.renderNotificationItems(readNotificationList, false)}
            </NotificationList>
        )
    }
}

const mapStateToProps = state => ({
    readNotificationList: selectors.readNotificationList(state),
    unreadNotificationList: selectors.unreadNotificationList(state),
    showMoreIndex: selectors.showMoreIndex(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            init: actions.init,
            setShowMoreIndex: actions.setShowMoreIndex,
            resetShowMoreIndex: actions.resetShowMoreIndex,
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
