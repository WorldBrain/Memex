import moment from 'moment'
import React, { Component } from 'react'
import classNames from 'classnames'
import { remoteFunction, runInBackground } from 'src/util/webextensionRPC'
import LoadingBlocker from '../../../../common-ui/components/loading-blocker'
import RestoreConfirmation from '../components/restore-confirmation'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { WhiteSpacer10 } from 'src/common-ui/components/design-library/typography'
import { UserFeature } from '@worldbrain/memex-common/lib/subscriptions/types'
import { fetchBackupPath, checkServerStatus } from '../../utils'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'
import { AuthContextInterface } from 'src/authentication/background/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { auth, subscription } from 'src/util/remote-functions-background'
import type { PersonalCloudRemoteInterface } from 'src/personal-cloud/background/types'
import { DumpPane } from './dump-pane'
import styled from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { Status } from '@sentry/node'

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
    personalCloudBG?: PersonalCloudRemoteInterface
}

export class OverviewContainer extends Component<Props & AuthContextInterface> {
    static defaultProps: Pick<Props, 'personalCloudBG'> = {
        personalCloudBG: runInBackground(),
    }

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
        isCloudSyncEnabled: true,
        isDev: process.env.NODE_ENV !== 'production',
    }

    async componentDidMount() {
        const status = await checkServerStatus()
        const isCloudSyncEnabled = await this.props.personalCloudBG.isCloudSyncEnabled()
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
            isCloudSyncEnabled,
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
        window.open(portalLink['access_url'])
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

    private renderUpgradeBtn() {
        if (this.state.loadingChargebee) {
            return (
                <SecondaryAction
                    label={<LoadingIndicator />}
                    onClick={undefined}
                />
            )
        }

        return (
            <SecondaryAction
                label="⭐️ Upgrade"
                onClick={
                    this.props.currentUser?.subscriptionStatus
                        ? this.openPortal
                        : this.props.showSubscriptionModal
                }
            />
        )
    }

    private renderOldBackupPanes() {
        const automaticBackupsAllowed = this.props.currentUser?.authorizedFeatures?.includes(
            'backup',
        )

        return (
            <>
                <Section>
                    <SectionCircle>
                        <Icon
                            filePath={icons.imports}
                            heightAndWidth="34px"
                            color="purple"
                            hoverOff
                        />
                    </SectionCircle>
                    <SectionTitle>Backup your data locally</SectionTitle>
                    {!this.state.hasInitialBackup ? (
                        <StatusLine>
                            <InfoText>
                                Automatically backup your data to your local
                                hard drive with the Memex backup helper
                            </InfoText>
                            <PrimaryAction
                                onClick={this.props.onBackupRequested}
                                label={'Start Wizard'}
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
                                                moment(
                                                    this.state.backupTimes
                                                        .lastBackup,
                                                ).fromNow()}
                                        </Number>
                                        <SubTitle>Last Backup</SubTitle>
                                    </InfoBlock>
                                    <InfoBlock>
                                        <Number>
                                            {this.state.backupTimes
                                                .nextBackup !== 'running'
                                                ? moment(
                                                      this.state.backupTimes
                                                          .nextBackup,
                                                  ).fromNow()
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
                                    <Icon
                                        filePath={
                                            this.state.backupPath === null &&
                                            this.state.backupLocation ===
                                                'local'
                                                ? icons.warning
                                                : icons.folder
                                        }
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
                                            {this.state.backupPath === null &&
                                                this.state.backupLocation ===
                                                    'local' &&
                                                'Your Memex Backup Helper is not running!'}
                                        </PathString>
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
                                    />
                                )}
                            </StatusLine>
                        </div>
                    )}
                </Section>

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
            return <LoadingBlocker />
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
                    !this.state.isCloudSyncEnabled
                        ? this.renderOldBackupPanes()
                        : this.renderOldBackupPanes()
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
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 18px;
    font-weight: bold;
`

const SubTitle = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 16px;
    font-weight: normal;
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

const StatusLine = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: 5px;
    justify-content: fled-start;
`

export default connect(null, (dispatch) => ({
    showSubscriptionModal: () => dispatch(show({ modalId: 'Subscription' })),
}))(withCurrentUser(OverviewContainer))
