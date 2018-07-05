import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

// import * as actions from './actions'
// import * as selectors from './selectors'
import NotificationList from './components/NotificationList'
import Notification from './components/Notification'
import * as notifications from './notifications'

class NotificationContainer extends Component {
    static propTypes = {
        // showInbox: PropTypes.bool.isRequired,
    }

    isNotificationTruncated(message) {
        const NotificationCharLimit = 100
        if (message.length <= NotificationCharLimit) {
            return false
        } else {
            return true
        }
    }

    truncateText(message) {
        const NotificationCharLimit = 100

        const lastSpaceBeforeCutoff = message.lastIndexOf(
            ' ',
            NotificationCharLimit,
        )
        const trunctatedText = message.substr(0, lastSpaceBeforeCutoff)
        return trunctatedText
    }

    renderNotificationItems() {
        return notifications.NOTIFS.map((notification, i) => {
            const isTruncated = this.isNotificationTruncated(
                notification.message,
            )
            const trucatedMessage = isTruncated
                ? this.truncateText(notification.message)
                : notification.message

            return (
                <Notification
                    key={i}
                    title={notification.title}
                    message={trucatedMessage}
                    buttonText={notification.button}
                    date={notification.date}
                    isShowMore={isTruncated}
                />
            )
        })
    }

    render() {
        return (
            <NotificationList>
                {this.renderNotificationItems()}
            </NotificationList>
        )
    }
}

const mapStateToProps = state => ({
    // showInbox: selectors.showInbox(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            // toggleInbox: actions.toggleInbox,
        },
        dispatch,
    ),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationContainer)
