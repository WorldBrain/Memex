import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import localStyles from './Notification.css'

const hasOnlyButton = hasButton =>
    classNames(localStyles.buttonTick, {
        [localStyles.onlyTick]: !hasButton,
    })

const Notification = props => (
    <li>
        <div className={localStyles.mainNotifContainer}>
            <div className={localStyles.logo}>
                <img src="/img/worldbrain-logo-narrow.png" />
            </div>
            <div className={localStyles.content}>
                <div className={localStyles.messageWhy}>
                    <div className={localStyles.titleMessage}>
                        <div className={localStyles.title}>{props.title}</div>
                        <div className={localStyles.message}>
                            {props.message}
                        </div>
                        <div className={localStyles.showMore}>Show More</div>
                    </div>
                    <div className={localStyles.why}>
                        Why am I seeing this?
                        <span className={localStyles.whyText}>
                            This notification has been stored in the code of
                            last update. No connection to our servers have been
                            made to send it to you.
                        </span>
                    </div>
                </div>
                <div className={hasOnlyButton(props.buttonText)}>
                    {props.buttonText && (
                        <div className={localStyles.button}>
                            {props.buttonText}
                        </div>
                    )}
                    <div className={localStyles.tick}>
                        <i className="material-icons">done</i>
                    </div>
                </div>
            </div>
        </div>
    </li>
)

Notification.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    buttonText: PropTypes.string,
}

export default Notification
