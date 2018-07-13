import React from 'react'
import { remoteFunction } from 'src/util/webextensionRPC'
import BackupSettings from './presentation'

export default class BackupSettingsContainer extends React.Component {
    handleLoginRequested = async () => {
        window.location.href = await remoteFunction(
            'getBackupProviderLoginLink',
        )({
            returnURL: 'http://memex.cloud/backup/auth-redirect/google-drive',
            provider: 'googledrive',
        })
    }

    render() {
        return (
            <div>
                <BackupSettings onLoginRequested={this.handleLoginRequested} />
            </div>
        )
    }
}
