import React from 'react'
import PropTypes from 'prop-types'
import { ProviderList } from '../components/provider-list'
import {
    DownloadOverlay,
    CopyOverlay,
    ChangeOverlay,
} from '../components/overlays'
import Styles from '../../styles.css'
import {
    checkServerStatus,
    fetchBackupPath,
    changeBackupPath,
} from '../../utils'
import { WhiteSpacer30 } from 'src/common-ui/components/design-library/typography'
import { remoteFunction } from 'src/util/webextensionRPC'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

const settingsStyle = require('src/options/settings/components/settings.css')

export default class SetupLocation extends React.Component {
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

    _proceedIfServerIsRunning = async () => {
        let overlay = null
        let backupPath = null
        const status = await checkServerStatus()
        if (status) {
            backupPath = await fetchBackupPath()
        } else {
            overlay = 'download'
        }
        this.setState({
            backupPath,
            overlay,
        })
    }

    _handleChangeBackupPath = async () => {
        const newBackupPath = await changeBackupPath()
        if (newBackupPath) {
            const { initialBackup, backendLocation, backupPath } = this.state
            /* If the user is trying to change the local backup location to a different
                folder, show the copy overlay */
            if (
                initialBackup &&
                backendLocation === 'local' &&
                newBackupPath !== backupPath
            ) {
                this.setState({
                    overlay: 'copy',
                })
            }
            this.setState({
                backupPath: newBackupPath,
            })
        } else {
            this.setState({
                overlay: 'download',
            })
        }
    }

    render() {
        return (
            <div className={settingsStyle.section}>
                <div className={settingsStyle.sectionTitle}>
                    <strong>STEP 1/5: </strong>
                    Where do you want to store your data?
                </div>
                <ProviderList
                    className={Styles.selectionlist}
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
                            if (
                                backendLocation === 'google-drive' &&
                                this.state.backupPath
                            ) {
                                this.setState({
                                    overlay: 'change',
                                })
                            }
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
                <WhiteSpacer30 />
                <div className={settingsStyle.buttonArea}>
                    <div />
                    <PrimaryAction
                        disabled={
                            !this.state.provider ||
                            (this.state.provider === 'local' &&
                                !this.state.backupPath)
                        }
                        onClick={() => this.props.onChoice(this.state.provider)}
                        label={'Continue'}
                    />
                </div>
            </div>
        )
    }
}

SetupLocation.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onChangeLocalLocation: PropTypes.func.isRequired,
}
