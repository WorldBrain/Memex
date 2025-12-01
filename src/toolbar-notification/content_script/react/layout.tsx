import React from 'react'
import PropTypes from 'prop-types'

export default function NotificationLayout({
    title,
    children,
    onCloseRequested,
    thirdRowImage,
}) {
    return (
        <div>
            <div>
                <div>{title}</div>
                <div>{children}</div>
            </div>
            <div>
                {thirdRowImage && <img src={thirdRowImage} />}
                <span onClick={() => onCloseRequested()} />
            </div>
        </div>
    )
}

NotificationLayout['propTypes'] = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    onCloseRequested: PropTypes.func.isRequired,
}
