import React from 'react'
import PropTypes from 'prop-types'
import {
    checkServerStatus,
    fetchBackupPath,
    changeBackupPath,
} from '../../utils'
import { remoteFunction } from 'src/util/webextensionRPC'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

export default class SetupLocation extends React.Component {
    state = {
        provider: null,
        path: null,
        overlay: null,
        backupPath: null,
        initialBackup: false,
        backendLocation: null,
    }

    async componentDidMount() {
        await this._proceedIfServerIsRunning()

        const initialBackup = await remoteFunction('hasInitialBackup')()
        const backendLocation = await remoteFunction('getBackendLocation')()
        const provider = 'local'
        this.setState({
            initialBackup,
            backendLocation,
            provider,
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
            overlay = null
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
        return this.state.overlay === 'download' ? (
            <SettingSection
                title={'Download the Backup Helper App'}
                icon={'folder'}
                description={
                    <span>
                        Download & start the app. Make sure to move it into your
                        application folder. Then click on "I'm ready!"
                        <a
                            target="_blank"
                            href="https://worldbrain.io/tutorials/backups"
                        >
                            Learn more ▸
                        </a>
                    </span>
                }
            >
                <LinkBox>
                    <Icon
                        onClick={() =>
                            window.open('https://worldbrain.io/download/win')
                        }
                        filePath="winLogo"
                        heightAndWidth="30px"
                        color={'normalText'}
                        padding={'10px'}
                        defaultBackground
                    />

                    <Icon
                        onClick={() =>
                            window.open('https://worldbrain.io/download/mac')
                        }
                        filePath="macLogo"
                        heightAndWidth="30px"
                        color={'normalText'}
                        padding={'10px'}
                        defaultBackground
                    />
                    <Icon
                        onClick={() =>
                            window.open('https://worldbrain.io/download/linux')
                        }
                        filePath="linuxLogo"
                        heightAndWidth="30px"
                        color={'normalText'}
                        padding={'10px'}
                        defaultBackground
                    />
                </LinkBox>
                <PrimaryAction
                    // disabled={
                    //     !this.state.provider ||
                    //     (this.state.provider === 'local' &&
                    //         !this.state.backupPath)
                    // }
                    onClick={() => {
                        this._proceedIfServerIsRunning()
                    }}
                    label={"I'm ready"}
                />
            </SettingSection>
        ) : (
            <SettingSection
                title={'Select your backup location'}
                icon={'imports'}
                description={
                    <span>
                        Select a folder to put your backup into.
                        <a
                            target="_blank"
                            href="https://worldbrain.io/tutorials/backups"
                        >
                            &nbsp; Learn more ▸
                        </a>
                    </span>
                }
            >
                {this.state.backupPath !== null ? (
                    <SelectFolderArea
                        onClick={(e) => {
                            e.preventDefault()
                            this._handleChangeBackupPath()
                        }}
                    >
                        <TextField
                            icon={'folder'}
                            value={
                                this.state.backupPath &&
                                this.state.backupPath.length
                                    ? this.state.backupPath
                                    : 'Click to select folder'
                            }
                            disabled
                        />
                    </SelectFolderArea>
                ) : null}

                <PrimaryAction
                    disabled={
                        !this.state.provider ||
                        (this.state.provider === 'local' &&
                            !this.state.backupPath)
                    }
                    onClick={() => {
                        this.props.onChoice({
                            provider: this.state.provider,
                            type: 'automatic',
                        })
                    }}
                    label={'Continue'}
                />
            </SettingSection>
        )

        //     {/* {() => this.props.onClick('continue')}
        //     <div className={settingsStyle.buttonArea}>
        //         <div />
        //         <PrimaryAction
        //             disabled={
        //                 !this.state.provider ||
        //                 (this.state.provider === 'local' &&
        //                     !this.state.backupPath)
        //             }
        //             onClick={() => this.props.onChoice(this.state.provider)}
        //             label={'Continue'}
        //         />
        //     </div> */}

        //     {/* <ProviderList
        //         className={Styles.selectionlist}
        //         backupPath={this.state.backupPath}
        //         handleChangeBackupPath={this._handleChangeBackupPath}
        //         onChange={async provider => {
        //             const { backendLocation } = this.state
        //             /* Only show the change modal right now, if the user is changing from
        //                local to google-drive. Google drive to Local modal is not shown
        //                right now
        //             if (
        //                 backendLocation === 'local' &&
        //                 provider === 'google-drive'
        //             ) {
        //                 this.setState({
        //                     overlay: 'change',
        //                 })
        //             }
        //             if (provider === 'local') {
        //                 await this._proceedIfServerIsRunning(provider)
        //                 if (
        //                     backendLocation === 'google-drive' &&
        //                     this.state.backupPath
        //                 ) {
        //                     this.setState({
        //                         overlay: 'change',
        //                     })
        //                 }
        //             }
        //             this.setState({
        //                 provider,
        //             })
        //         }}
        //     /> */}

        //     {/* <DownloadOverlay
        //         disabled={this.state.overlay !== 'download'}
        //         onClick={async action => {
        //             if (action === 'continue') {
        //                 this.setState({ overlay: null })
        //                 await this._proceedIfServerIsRunning(
        //                     this.state.provider,
        //                 )
        //             }
        //             if (action === 'cancel') {
        //                 this.setState({ overlay: null })
        //             }
        //         }}
        //     /> */}
        //     <CopyOverlay
        //         disabled={this.state.overlay !== 'copy'}
        //         onClick={async (action) => {
        //             if (action === 'copied') {
        //                 this.setState({ overlay: null })
        //                 this.props.onChangeLocalLocation()
        //             } else if (action === 'newbackup') {
        //                 this.setState({ overlay: null })
        //                 await remoteFunction('forgetAllChanges')()
        //                 this.props.onChangeLocalLocation()
        //             }
        //         }}
        //     />
        //     {/* <ChangeOverlay
        //         disabled={this.state.overlay !== 'change'}
        //         onClick={async action => {
        //             if (action === 'yes') {
        //                 this.setState({ overlay: null })
        //                 await remoteFunction('forgetAllChanges')()
        //                 this.props.onChoice(this.state.provider)
        //             }
        //             if (action === 'nope') {
        //                 this.setState({ overlay: null })
        //             }
        //         }}
        //     />
        //     <WhiteSpacer30 /> */}
        // </SettingSection>
    }
}

const SelectFolderArea = styled.div`
    border-radius: 12px;
    display: grid;
    align-items: center;
    cursor: pointer;
    margin-bottom: 20px;

    & * {
        cursor: pointer;
    }

    &:hover {
        opacity: 0.8;
    }
`
const LinkBox = styled.div`
    display: flex;
    grid-gap: 10px;
    margin: 20px 0;
    width: 300px;
`

SetupLocation.propTypes = {
    onChoice: PropTypes.func.isRequired,
    // onChangeLocalLocation: PropTypes.func.isRequired,
}
