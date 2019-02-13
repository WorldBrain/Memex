import React from 'react'
import PropTypes from 'prop-types'
import { ProviderList } from '../components/provider-list'
import { PrimaryButton } from '../components/primary-button'
import {
    DownloadOverlay,
    CopyOverlay,
    ChangeOverlay,
} from '../components/overlays'
import Styles from '../styles.css'
import { getStringFromResponseBody } from '../utils'
import { remoteFunction } from 'src/util/webextensionRPC'

export default class OnboardingWhere extends React.Component {
    state = {
        provider: null,
        path: null,
        overlay: false,
        backupPath: null,
        initialBackup: false,
        backendLocation: null,
    }

    async componentDidMount() {
        /* Keep checking backend server for the local backup location */
        this.timer = setInterval(async () => {
            if (this.state.provider === 'local') {
                const status = await this._fetchBackupPath()
                if (!status) {
                    clearInterval(this.timer)
                }
            }
        }, 1000)

        const initialBackup = await remoteFunction('hasInitialBackup')()
        const backendLocation = await remoteFunction('getBackendLocation')()
        this.setState({
            initialBackup,
            backendLocation,
        })
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }

    timer = null

    _fetchBackupPath = async () => {
        try {
            const response = await fetch(
                'http://localhost:11922/backup/location',
            )
            const backupPath = await getStringFromResponseBody(response)
            if (backupPath && backupPath.length) {
                this.setState({ backupPath })
            } else {
                this.setState({ backupPath: '' })
            }
        } catch (err) {
            this.setState({ backupPath: null, overlay: 'download' })
            return false
        }
        return true
    }

    _proceedIfServerIsRunning = async provider => {
        let overlay = null
        try {
            const response = await fetch('http://localhost:11922/status')
            const serverStatus = await getStringFromResponseBody(response)
            if (serverStatus === 'running') {
                await this._fetchBackupPath()
            } else {
                overlay = 'download'
            }
        } catch (err) {
            // Show the download overlay if we couldn't connect to the server.
            overlay = 'download'
        }
        this.setState({
            provider,
            overlay,
        })
    }

    _handleChangeBackupPath = async () => {
        try {
            await fetch('http://localhost:11922/backup/open-change-location')
            await this._fetchBackupPath()

            const { initialBackup, backendLocation } = this.state
            if (initialBackup && backendLocation === 'local') {
                this.setState({
                    overlay: 'copy',
                })
            }
        } catch (err) {
            this.setState({ overlay: true })
        }
    }

    render() {
        console.log(this)
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
                        const { backendLocation } = this.state
                        if (backendLocation && provider !== backendLocation) {
                            this.setState({
                                overlay: 'change',
                            })
                        }
                        if (provider === 'local') {
                            await this._proceedIfServerIsRunning(provider)
                        }
                        this.setState({
                            provider,
                        })
                    }}
                />
                <DownloadOverlay
                    disabled={this.state.overlay !== 'download'}
                    onClick={async action => {
                        if (action === 'continue') {
                            this.setState({ overlay: null })
                            await this._proceedIfServerIsRunning(
                                this.state.provider,
                            )
                        }
                        if (action === 'cancel') {
                            this.setState({ overlay: null })
                        }
                    }}
                />
                <CopyOverlay
                    disabled={this.state.overlay !== 'copy'}
                    onClick={async action => {
                        if (action === 'copied') {
                            this.setState({ overlay: null })
                            this.props.onChangeLocalLocation()
                        } else if (action === 'newbackup') {
                            this.setState({ overlay: null })
                            await remoteFunction('forgetAllChanges')()
                            this.props.onChangeLocalLocation()
                        }
                    }}
                />
                <ChangeOverlay
                    disabled={this.state.overlay !== 'change'}
                    onClick={async action => {
                        if (action === 'yes') {
                            this.setState({ overlay: null })
                            await remoteFunction('forgetAllChanges')()
                            this.props.onChoice(this.state.provider)
                        }
                        if (action === 'nope') {
                            this.setState({ overlay: null })
                        }
                    }}
                />
                <PrimaryButton
                    disabled={
                        !this.state.provider ||
                        (this.state.provider === 'local' &&
                            !this.state.backupPath)
                    }
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
    onChangeLocalLocation: PropTypes.func.isRequired,
}
