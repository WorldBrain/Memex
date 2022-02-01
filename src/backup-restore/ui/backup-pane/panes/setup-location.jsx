import React from 'react'
import PropTypes from 'prop-types'
import {
    // DownloadOverlay,
    CopyOverlay,
    // ChangeOverlay,
} from '../components/overlays'
import {
    checkServerStatus,
    fetchBackupPath,
    changeBackupPath,
} from '../../utils'
import { remoteFunction } from 'src/util/webextensionRPC'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

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
        await this._proceedIfServerIsRunning('local')

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
        return (
            <Section>
                <SectionCircle>
                    <Icon
                        filePath={icons.imports}
                        heightAndWidth="34px"
                        color="purple"
                        hoverOff
                    />
                </SectionCircle>
                {this.state.overlay === 'download' ? (
                    <>
                        <SectionTitle>
                            Download the Backup Helper App
                        </SectionTitle>
                        <InfoText>
                            Download & start the app. Make sure to move it into
                            your application folder. <br />
                            Then click on "I'm ready!"
                            <a
                                target="_blank"
                                href="https://worldbrain.io/tutorials/backups"
                            >
                                &nbsp; Learn more ▸
                            </a>
                        </InfoText>
                        <LinkBox>
                            <a
                                href="https://worldbrain.io/download/win"
                                target="_blank"
                            >
                                <OSLogos src={'img/windows_logo.svg'} />
                            </a>
                            <a
                                href="https://worldbrain.io/download/mac"
                                target="_blank"
                            >
                                <OSLogos src={'img/apple_logo.svg'} />
                            </a>
                            <a
                                href="https://worldbrain.io/download/linux"
                                target="_blank"
                            >
                                <OSLogos src={'img/linux_logo.svg'} />
                            </a>
                        </LinkBox>
                        <div className={settingsStyle.buttonArea}>
                            <div />
                            <PrimaryAction
                                // disabled={
                                //     !this.state.provider ||
                                //     (this.state.provider === 'local' &&
                                //         !this.state.backupPath)
                                // }
                                onClick={() => {
                                    this._proceedIfServerIsRunning('local')
                                }}
                                label={"I'm ready"}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <SectionTitle>Select your backup location</SectionTitle>
                        <InfoText>
                            Select a folder to put your backup into.
                            <a
                                target="_blank"
                                href="https://worldbrain.io/tutorials/backups"
                            >
                                &nbsp; Learn more ▸
                            </a>
                        </InfoText>
                        {this.state.backupPath !== null ? (
                            <SelectFolderArea
                                onClick={(e) => {
                                    e.preventDefault()
                                    this._handleChangeBackupPath()
                                }}
                            >
                                <Icon
                                    filePath={icons.folder}
                                    heightAndWidth="20px"
                                    hoverOff
                                />
                                {this.state.backupPath &&
                                this.state.backupPath.length ? (
                                    <>
                                        <PathString>
                                            {this.state.backupPath}
                                        </PathString>
                                    </>
                                ) : (
                                    <PathString>
                                        Click to select folder
                                    </PathString>
                                )}
                            </SelectFolderArea>
                        ) : null}

                        <div className={settingsStyle.buttonArea}>
                            <div />
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
                        </div>
                    </>
                )}

                {/* {() => this.props.onClick('continue')}
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
                </div> */}

                {/* <ProviderList
                    className={Styles.selectionlist}
                    backupPath={this.state.backupPath}
                    handleChangeBackupPath={this._handleChangeBackupPath}
                    onChange={async provider => {
                        const { backendLocation } = this.state
                        /* Only show the change modal right now, if the user is changing from
                           local to google-drive. Google drive to Local modal is not shown
                           right now 
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
                /> */}

                {/* <DownloadOverlay
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
                /> */}
                <CopyOverlay
                    disabled={this.state.overlay !== 'copy'}
                    onClick={async (action) => {
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
                {/* <ChangeOverlay
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
                <WhiteSpacer30 /> */}
            </Section>
        )
    }
}

const SelectFolderArea = styled.div`
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    border-radius: 12px;
    padding: 10px 15px;
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: column;
    align-items: center;
    justify-content: flex-start;
    margin: 0 0 30px 0;
    cursor: pointer;

    &: hover {
        background: ${(props) => props.theme.colors.backgroundColor};
    }
`

const PathString = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-weight: 400;
    font-size: 14px;
`

const Section = styled.div`
    background: #ffffff;
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 50px;
    margin-bottom: 30px;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 80px;
    width: 80px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    margin-bottom: 40px;
    font-weight: 500;
`

const LinkBox = styled.div`
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: column;
    justify-self: center;
    margin-top: 20px;
    width: 200px;
`

const OSLogos = styled.img`
    height: 30px;
    width: auto;
`

SetupLocation.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onChangeLocalLocation: PropTypes.func.isRequired,
}
