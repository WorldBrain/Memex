import React from 'react'
import PropTypes from 'prop-types'
import { ProviderList } from '../components/provider-list'
import { PrimaryButton } from '../components/primary-button'
import { DownloadOverlay } from '../components/download-overlay'
import Styles from '../styles.css'
import { getStringFromResponseBody } from '../utils'

export default class OnboardingWhere extends React.Component {
    state = { provider: null, path: null, overlay: false, backupPath: null }

    _proceedIfServerIsRunning = async provider => {
        try {
            let response = await fetch('http://localhost:11922/status')
            const serverStatus = await getStringFromResponseBody(response)
            if (serverStatus === 'running') {
                response = await fetch('http://localhost:11922/backup/location')
                const backupPath = await getStringFromResponseBody(response)
                if (backupPath && backupPath.length) {
                    this.setState({ backupPath, provider })
                } else {
                    this.setState({ backupPath: null })
                }
            } else {
                this.setState({ backupPath: null, overlay: true })
            }
        } catch (err) {
            // Show the overlay if we couldn't connect to the server.
            this.setState({ backupPath: null, overlay: true })
        }
    }

    _handleChangeBackupPath = async () => {
        try {
            let response = await fetch(
                'http://localhost:11922/backup/open-change-location',
            )
            response = await fetch('http://localhost:11922/backup/location')
            const backupPath = await getStringFromResponseBody(response)
            if (backupPath && backupPath.length) {
                this.setState({ backupPath })
            } else {
                this.setState({ backupPath: null })
            }
        } catch (err) {
            this.setState({ backupPath: null, overlay: true })
        }
    }

    render() {
        return (
            <div>
                <p className={Styles.header2}>
                    <strong>STEP 1/5: </strong>
                    WHERE?
                </p>
                <ProviderList
                    backupPath={this.state.backupPath}
                    handleChangeBackupPath={this._handleChangeBackupPath}
                    onChange={async provider => {
                        if (provider === 'local') {
                            await this._proceedIfServerIsRunning(provider)
                        }
                    }}
                />
                <DownloadOverlay
                    disabled={!this.state.overlay}
                    onClick={async action => {
                        if (action === 'continue') {
                            this.setState({ overlay: false })
                            await this._proceedIfServerIsRunning(
                                this.state.provider,
                            )
                        }
                        if (action === 'cancel') {
                            this.setState({ overlay: false })
                        }
                    }}
                />
                <PrimaryButton
                    disabled={!this.state.provider || !this.state.backupPath}
                    onClick={() => this.props.onChoice(this.state.provider)}
                >
                    Continue
                </PrimaryButton>
            </div>
        )
    }
}

OnboardingWhere.propTypes = {
    onChoice: PropTypes.func.isRequired,
}
