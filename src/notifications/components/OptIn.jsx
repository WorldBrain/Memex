import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './Notification.css'

const OptIn = props => (
    <div className={localStyles.optInContainer}>
        {props.children}
        <div className={localStyles.optInTextContainer}>
            <p className={localStyles.optIn}>
                Change tracking
            </p>
        </div>
    </div>
)

OptIn.propTypes = {
    children: PropTypes.node.isRequired,
}

export default OptIn
