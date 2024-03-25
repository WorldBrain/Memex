import React from 'react'
import browser from 'webextension-polyfill'
import { checkServerStatus } from '../../utils'
import PropTypes from 'prop-types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import ButtonBar from 'src/options/imports/components/ButtonBar'
import { getFolder } from 'src/pkm-integrations/background/backend/utils'

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

        const data = await browser.storage.local.get('PKMSYNCpkmFolders')
        let backupFolder = null
        if (data) {
            backupFolder = data.PKMSYNCpkmFolders.backupFolder || null
            if (backupFolder) {
                this.setState({
                    backupPath: backupFolder,
                })
            }
        }
    }

    componentWillUnmount() {
        clearInterval(this.timer)
    }

    timer = null

    _proceedIfServerIsRunning = async () => {
        let overlay = null
        const status = await checkServerStatus({ storageAPI: browser.storage })
        if (status) {
            overlay = null
        } else {
            overlay = 'download'
        }
        this.setState({
            overlay,
        })
    }

    _handleChangeBackupPath = async () => {
        const newBackupPath = await getFolder('backup', {
            storageAPI: browser.storage,
        })

        if (newBackupPath) {
            const { initialBackup, backendLocation, backupPath } = this.state
            /* If the user is trying to change the local backup location to a different
                folder, show the copy overlay */
            if (
                initialBackup &&
                backendLocation === 'local' &&
                newBackupPath.backupFolder !== backupPath
            ) {
                this.setState({
                    overlay: 'copy',
                })
                this.setState({
                    backupPath: newBackupPath.backupFolder,
                })
            } else {
                this.setState({
                    backupPath: newBackupPath.backupFolder,
                })
            }
        } else if (!newBackupPath && !this.state.backupPath) {
            this.setState({
                backupPath: newBackupPath.backupFolder,
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
                        {/* <a
                            target="_blank"
                            href="https://links.memex.garden/tutorials/backups"
                        >
                            Learn more ▸
                        </a> */}
                    </span>
                }
            >
                <LinkBox>
                    <Icon
                        onClick={() =>
                            window.open(
                                'https://github.com/WorldBrain/memex-local-sync/releases/latest',
                            )
                        }
                        filePath="winLogo"
                        heightAndWidth="30px"
                        color={'white'}
                        padding={'10px'}
                        defaultBackground
                    />

                    <Icon
                        onClick={() =>
                            window.open(
                                'https://github.com/WorldBrain/memex-local-sync/releases/latest',
                            )
                        }
                        filePath="macLogo"
                        heightAndWidth="30px"
                        color={'white'}
                        padding={'10px'}
                        defaultBackground
                    />
                    <Icon
                        onClick={() =>
                            window.open(
                                'https://github.com/WorldBrain/memex-local-sync/releases/latest',
                            )
                        }
                        filePath="linuxLogo"
                        heightAndWidth="30px"
                        color={'white'}
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
                    label={
                        "I've installed and started the Memex Local Sync Helper"
                    }
                    type="primary"
                    size="medium"
                />
            </SettingSection>
        ) : (
            <SettingSection
                title={'Select your backup location'}
                icon={'imports'}
                description={
                    <span>
                        Select a folder to put your backup into.
                        {/* <a
                            target="_blank"
                            href="https://tutorials.memex.garden/tutorials/backups"
                        >
                            &nbsp; Learn more ▸
                        </a> */}
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
                            onClick={(e) => {
                                e.preventDefault()
                                this._handleChangeBackupPath()
                            }}
                        />
                    </SelectFolderArea>
                ) : null}

                {this.state.backupPath !== null ? (
                    <ButtonBar>
                        <PrimaryAction
                            onClick={async () => {
                                await this._handleChangeBackupPath()
                            }}
                            label={'Change Backup Folder'}
                            type="tertiary"
                            size="medium"
                        />
                        <PrimaryAction
                            onClick={() =>
                                this.props.onChoice(this.state.provider)
                            }
                            label={'Continue'}
                            type="primary"
                            size="medium"
                        />
                    </ButtonBar>
                ) : (
                    <PrimaryAction
                        onClick={async () => {
                            await this._handleChangeBackupPath()
                        }}
                        label={'Select Backup Folder'}
                        type="primary"
                        size="medium"
                    />
                )}
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
