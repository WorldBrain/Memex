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
        let backupPath
        try {
            const response = await fetch(
                'http://localhost:11922/backup/location',
            )
            backupPath = await getStringFromResponseBody(response)
            if (backupPath && backupPath.length) {
                this.setState({ backupPath })
            } else {
                this.setState({ backupPath: '' })
            }
        } catch (err) {
            this.setState({ backupPath: null, overlay: 'download' })
            return false
        }
        return backupPath
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
            const { initialBackup, backendLocation } = this.state

            /* Keep checking backend server for the local backup location */
            this.timer = setInterval(async () => {
                if (this.state.provider === 'local') {
                    const prevLocation = this.state.backupPath
                    const location = await this._fetchBackupPath()
                    if (!location) {
                        this.setState({
                            overlay: 'download',
                        })
                    } else if (location !== prevLocation) {
                        clearInterval(this.timer)
                        /* Throw change modal if they are changing from google-drive 
                           to local. Else throw copy modal if they are just trying to 
                           change the location. */
                        if (
                            initialBackup &&
                            backendLocation === 'google-drive'
                        ) {
                            this.setState({
                                overlay: 'change',
                            })
                        } else if (
                            initialBackup &&
                            backendLocation === 'local'
                        ) {
                            this.setState({
                                overlay: 'copy',
                            })
                        }
                    }
                }
            }, 1000)
        } catch (err) {
            this.setState({ overlay: 'download' })
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
                        /* Only show the change modal right now, if the user is changing from
                           local to google-drive. Google drive to Local modal is not shown
                           right now */
                        if (
                            backendLocation === 'local' &&
                            provider === 'google-drive'
                        ) {
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
