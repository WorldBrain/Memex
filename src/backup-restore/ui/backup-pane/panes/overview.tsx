import React, { Component } from 'react'
import classNames from 'classnames'
import browser from 'webextension-polyfill'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import LoadingBlock from '@worldbrain/memex-common/lib/common-ui/components/loading-block'
import RestoreConfirmation from '../components/restore-confirmation'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { WhiteSpacer10 } from 'src/common-ui/components/design-library/typography'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import { fetchBackupPath, checkServerStatus } from '../../utils'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { AuthContextInterface } from 'src/authentication/background/types'
import { subscription } from 'src/util/remote-functions-background'
import styled from 'styled-components'
import SettingSection from '@worldbrain/memex-common/lib/common-ui/components/setting-section'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { formatTimeFromNow } from '@worldbrain/memex-common/lib/utils/date-time'

const styles = require('../../styles.css')
const settingsStyle = require('src/options/settings/components/settings.css')
const localStyles = require('./overview.css')

interface Props {
    onBackupRequested: (...args: any[]) => any
    onRestoreRequested: (...args: any[]) => any
    onBackupSetupRequested: (...args: any[]) => any
    onBlobPreferenceChange: (...args: any[]) => any
    onPaymentRequested: (...args: any[]) => any
    onDumpRequested: (...args: any[]) => any
    authorizedFeatures: UserFeature[]
    backupPath: string
    showSubscriptionModal: () => void
}

export class OverviewContainer extends Component<Props & AuthContextInterface> {
    state = {
        automaticBackupEnabled: null,
        backupTimes: null,
        hasInitialBackup: false,
        showAutomaticUpgradeDetails: false,
        showWarning: false,
        // upgradeBillingPeriod: null,
        showRestoreConfirmation: false,
        backupLocation: null,
        blobPreference: true,
        /* Pricing */
        showPricing: false,
        billingPeriod: null,
        subscribeModal: false,
        backupPath: null,
        loadingChargebee: false,
        isDev: process.env.NODE_ENV !== 'production',
    }

    async componentDidMount() {
        const status = await checkServerStatus({ storageAPI: browser.storage })
        const backupTimes = await remoteFunction('getBackupTimes')()
        const hasInitialBackup = await remoteFunction('hasInitialBackup')()
        const backupLocation = await remoteFunction('getBackendLocation')()
        const automaticBackupEnabled = await remoteFunction(
            'isAutomaticBackupEnabled',
        )()
        let showWarning = false
        let backupPath = null
        if (!hasInitialBackup && automaticBackupEnabled) {
            showWarning = true
        }
        if (status) {
            backupPath = await fetchBackupPath()
        }
        this.setState({
            automaticBackupEnabled,
            backupTimes,
            hasInitialBackup,
            backupLocation,
            showWarning,
            backupPath,
        })
    }

    openPortal = async () => {
        this.setState({
            loadingChargebee: true,
        })
        const portalLink = await subscription.getManageLink()
        globalThis.open(portalLink['access_url'])
        this.setState({
            loadingChargebee: false,
        })
    }

    handleToggle = () => {
        const blobPreference = !this.state.blobPreference
        this.props.onBlobPreferenceChange(blobPreference)
        this.setState({
            blobPreference,
        })
    }

    openSubscriptionModal = () => this.props.showSubscriptionModal()

    enableAutomaticBackup() {
        if (this.state.hasInitialBackup === true) {
            localStorage.setItem('backup.automatic-backups-enabled', 'true')
            this.setState({ automaticBackupEnabled: true })
        } else {
            this.props.onBackupSetupRequested()
        }
    }

    disableAutomaticBackup() {
        localStorage.setItem('backup.automatic-backups-enabled', 'false')
        this.setState({ automaticBackupEnabled: false })
    }

    private renderOldBackupPanes() {
        const automaticBackupsAllowed = this.props.currentUser?.authorizedFeatures?.includes(
            'backup',
        )

        return (
            <>
                <SettingSection
                    title={'Backup your data locally'}
                    icon={'folder'}
                    description={
                        'Automatically backup your data to your local hard drive with the Memex backup helper'
                    }
                >
                    {!this.state.hasInitialBackup ? (
                        <StatusLine>
                            <PrimaryAction
                                onClick={this.props.onBackupRequested}
                                label={'Start Wizard'}
                                size={'medium'}
                                type={'primary'}
                            />
                        </StatusLine>
                    ) : (
                        <div>
                            {/* The status line with last backup time */}
                            <WhiteSpacer10 />
                            <StatusLine>
                                <ProgressRowContainer>
                                    <InfoBlock>
                                        <Number>
                                            {this.state.backupTimes
                                                .lastBackup &&
                                                formatTimeFromNow(
                                                    this.state.backupTimes
                                                        .lastBackup,
                                                )}
                                        </Number>
                                        <SubTitle>Last Backup</SubTitle>
                                    </InfoBlock>
                                    <InfoBlock>
                                        <Number>
                                            {this.state.backupTimes
                                                .nextBackup !== 'running'
                                                ? formatTimeFromNow(
                                                      this.state.backupTimes
                                                          .nextBackup,
                                                  )
                                                : 'in progress'}
                                        </Number>
                                        <SubTitle>Next Backup</SubTitle>
                                    </InfoBlock>
                                </ProgressRowContainer>
                                <SelectFolderArea
                                    onClick={(e) => {
                                        e.preventDefault()
                                        this.props.onBackupRequested(true)
                                    }}
                                >
                                    {this.state.backupTimes.lastBackup &&
                                    this.state.backupPath === null ? (
                                        <TextField
                                            icon={'warning'}
                                            value={
                                                this.state.backupPath &&
                                                this.state.backupPath.length
                                                    ? this.state.backupPath
                                                    : 'Your Memex Backup Helper is not running!'
                                            }
                                            disabled
                                        />
                                    ) : (
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
                                    )}
                                </SelectFolderArea>
                                {this.state.backupPath && (
                                    <PrimaryAction
                                        onClick={this.props.onBackupRequested}
                                        label={
                                            this.state.backupTimes
                                                .nextBackup !== 'running'
                                                ? 'Backup Now'
                                                : 'Go to Backup'
                                        }
                                        type={'primary'}
                                        size={'medium'}
                                    />
                                )}
                            </StatusLine>
                        </div>
                    )}
                </SettingSection>

                {/* Settings Section */}
                {/* {this.state.hasInitialBackup && (
                    <div className={settingsStyle.section}>
                        <div className={styles.option}>
                            <div className={settingsStyle.sectionTitle}>
                                Backup Location
                            </div>
                            <div className={localStyles.statusLine}>
                                <div>
                                    {this.state.backupLocation === 'local' ? (
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            {this.state.backupPath === null &&
                                                this.state.backupLocation ===
                                                'local'
                                                ? '⚠️Your Memex Backup Helper is not running!'
                                                : this.state.backupPath}
                                        </span>
                                    ) : (
                                        <span
                                            className={classNames(
                                                settingsStyle.subname,
                                                localStyles.limitWidth,
                                            )}
                                        >
                                            Google Drive
                                        </span>
                                    )}
                                </div>
                                <SecondaryAction
                                    label={'Change'}
                                    onClick={() =>
                                        this.props.onBackupRequested(true)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                )} */}
            </>
        )
    }

    render() {
        if (!this.state.backupTimes) {
            return <LoadingBlock />
        }

        return (
            <div>
                {this.state.showRestoreConfirmation && (
                    <RestoreConfirmation
                        onConfirm={this.props.onRestoreRequested}
                        onClose={() =>
                            this.setState({ showRestoreConfirmation: false })
                        }
                    />
                )}
                {
                    this.renderOldBackupPanes()
                    //<DumpPane onDumpClick={this.props.onDumpRequested} />
                }
                {this.state.isDev && (
                    <div className={settingsStyle.section}>
                        <div className={settingsStyle.sectionTitle}>
                            Restore & Replace
                        </div>
                        <div className={styles.option}>
                            <div className={localStyles.statusLine}>
                                <span
                                    className={classNames(
                                        settingsStyle.subname,
                                        localStyles.limitWidth,
                                    )}
                                >
                                    <b>Replace</b> all current data with a
                                    backup.
                                </span>
                                <SecondaryAction
                                    onClick={() =>
                                        this.setState({
                                            showRestoreConfirmation: true,
                                        })
                                    }
                                    label={'Restore'}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
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

const PathString = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 400;
    font-size: 14px;
`

const ProgressRowContainer = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 50px;
    justify-content: flex-start;
    align-items: center;
    margin-top: 30px;
    margin-bottom: 50px;
    padding-left: 10px;
`

const InfoBlock = styled.div`
    display: grid;
    grid-gap: 5px;
    grid-auto-flow: row;
    justify-content: flex-start;
    align-items: center;
    width: 180px;
`

const Number = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 18px;
    font-weight: bold;
`

const SubTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: normal;
    font-weight: 300;
`
const StatusLine = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: 5px;
    justify-content: fled-start;
`

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(OverviewContainer))
