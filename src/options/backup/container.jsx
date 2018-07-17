import React from 'react'
// import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import BackupSettings from './presentation'

export default class BackupSettingsContainer extends React.Component {
    state = { status: null }

    async componentDidMount() {
        browser.runtime.onMessage.addListener(message => {
            if (message.type === 'backup-event') {
                this.handleBackupEvent(message.event)
            }
        })

        const isAuthenticated = await remoteFunction('isBackupAuthenticated')()
        this.setState({
            status: isAuthenticated ? 'authenticated' : 'unauthenticated',
        })
    }

    handleBackupEvent(event) {
        if (event.type === 'info') {
            this.setState({ info: event.info })
        } else if (event.type === 'success') {
            this.setState({ status: 'success' })
        } else if (event.type === 'fail') {
            this.setState({ status: 'fail' })
        }
    }

    handleLoginRequested = async () => {
        this.setState({ status: 'running' })

        window.location.href = await remoteFunction(
            'getBackupProviderLoginLink',
        )({
            returnURL: 'http://memex.cloud/backup/auth-redirect/google-drive',
            provider: 'googledrive',
        })
    }

    render() {
        if (!this.state.status) {
            return null
        }

        return (
            <div>
                <BackupSettings
                    info={this.state.info}
                    status={this.state.status || 'running'}
                    onLoginRequested={this.handleLoginRequested}
                />
            </div>
        )
    }
}
