import React from 'react'
import PropTypes from 'prop-types'

export default function BackupSettings(props) {
    if (props.status === 'unauthenticated') {
        return <PreLogin onLoginRequested={props.onLoginRequested} />
    } else if (props.status === 'authenticated') {
        return <PreBackup startBackup={props.startBackup} />
    } else if (props.status === 'running') {
        return <BackupRunning info={props.info} />
    } else if (props.status === 'success' || props.status === 'fail') {
        return <PostBackup status={props.status} />
    }
}

BackupSettings.propTypes = {
    info: PropTypes.object.isRequired,
    status: PropTypes.string.isRequired,
    onLoginRequested: PropTypes.func.isRequired,
    startBackup: PropTypes.func.isRequired,
}

export function PreLogin(props) {
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

PreLogin.propTypes = {
    onLoginRequested: PropTypes.func.isRequired,
}

export function PreBackup(props) {
    return (
        <div>
            You're logged in! Want to start backing up?
            <strong style={{ cursor: 'pointer' }} onClick={props.startBackup}>
                {' '}
                Okelidokeli o_o
            </strong>
        </div>
    )
}

PreBackup.propTypes = {
    startBackup: PropTypes.func.isRequired,
}

export function BackupRunning(props) {
    return <span>{JSON.stringify(props)}</span>
}

export function PostBackup(props) {
    return <span>Post backup: {props}</span>
}
