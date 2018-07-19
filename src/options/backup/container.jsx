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

        const isAuthenticated =
            false && (await remoteFunction('isBackupAuthenticated')())
        const isConnected = await remoteFunction('isBackupConnected')()

        if (isAuthenticated && !isConnected) {
            return await this.handleBackupEvent()
        }

        this.setState({
            status: isAuthenticated ? 'authenticated' : 'unauthenticated',
        })
    }

    handleBackupEvent(event) {
        if (event.type === 'info') {
            this.setState({ status: 'running', info: event.info })
        } else if (event.type === 'success') {
            this.setState({ status: 'success' })
        } else if (event.type === 'fail') {
            this.setState({ status: 'fail' })
        }
    }

    handleLoginRequested = async () => {
        window.location.href = await remoteFunction(
            'getBackupProviderLoginLink',
        )({
            returnUrl: 'http://memex.cloud/backup/auth-redirect/google-drive',
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
                    startBackup={() => remoteFunction('startBackup')()}
                />
            </div>
        )
    }
}
