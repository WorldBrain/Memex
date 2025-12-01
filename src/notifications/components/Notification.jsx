import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const Notification = (props) => (
    <li>
        <div>
            <div>
                <div>
                    <div>
                        <div>
                            <div>{props.title}</div>
                            <div>
                                <p>{props.message}</p>
                            </div>
                            {props.isShowMore && (
                                <div onClick={props.showMore}>
                                    Show {props.isMore ? 'More' : 'Less'}
                                </div>
                            )}
                        </div>
                    </div>
                    {(props.isUnread || props.buttonText) && (
                        <div>
                            <div>{props.buttons}</div>
                            {props.isUnread && (
                                <div
                                    onClick={props.handleTick}
                                    title="Mark as read"
                                >
                                    Mark as Read
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </li>
)

Notification.propTypes = {
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    buttonText: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.object),
    ]),
    isShowMore: PropTypes.bool.isRequired,
    showMore: PropTypes.func.isRequired,
    isMore: PropTypes.bool.isRequired,
    handleTick: PropTypes.func.isRequired,
    isUnread: PropTypes.bool.isRequired,
    buttons: PropTypes.arrayOf(PropTypes.node),
}

export default Notification
