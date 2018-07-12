import React from 'react'
import PropTypes from 'prop-types'

export default function BackupSettings(props) {
    return (
        <div>
            Want to do backup-y stuff with Google?
            <strong
                style={{ cursor: 'pointer' }}
                onClick={props.onLoginRequested}
            >
                {' '}
                Of course!
            </strong>
        </div>
    )
}

BackupSettings.propTypes = {
    onLoginRequested: PropTypes.func.isRequired,
}
