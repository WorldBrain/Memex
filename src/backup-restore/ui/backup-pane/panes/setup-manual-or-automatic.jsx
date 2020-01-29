import React from 'react'
import PropTypes from 'prop-types'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import Styles from '../../styles.css'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import SubscribeModal from 'src/authentication/components/Subscription/SubscribeModal'

const settingsStyle = require('src/options/settings/components/settings.css')

class SetupManualOrAutomatic extends React.Component {
    state = {
        mode: null,
        subscribeModal: false,
    }

    openSubscriptionModal = () => this.setState({ subscribeModal: true })
    closeSubscriptionModal = () => this.setState({ subscribeModal: false })

    render() {
        const isAuthorizedForAutomaticBackup = this.props.authorizedFeatures.includes(
            'backup',
        )
        return (
            <div>
                <div className={settingsStyle.section}>
                    <div className={settingsStyle.sectionTitle}>
                        <strong>STEP 2/5: </strong>
                        More or less work?
                    </div>
                    <OnboardingBackupMode
                        className={Styles.selectionlist}
                        onModeChange={mode => this.setState({ mode })}
                        launchSubscriptionFlow={this.props.onSubscribeRequested}
                        isAuthorizedForAutomaticBackup={
                            isAuthorizedForAutomaticBackup
                        }
                    />
                    <div className={settingsStyle.buttonArea}>
                        <SecondaryAction
                            onClick={this.props.onBackRequested}
                            label={'Go Back'}
                        />
                        <div>
                            {this.state.mode === 'manual' && (
                                <PrimaryAction
                                    onClick={() => this.props.onChoice({ type: 'manual' })}
                                    label={'Continue'}
                                />
                            )}
                            {(this.state.mode === 'automatic' && isAuthorizedForAutomaticBackup) && (
                                <PrimaryAction
                                    disabled={false}
                                    onClick={
                                        isAuthorizedForAutomaticBackup
                                            ? () =>
                                                  this.props.onChoice({ type: 'automatic' })
                                            : () => false
                                    }
                                    label={'Next'}
                                />
                            )}
                            {(isAuthorizedForAutomaticBackup === false && this.state.mode === 'automatic') && (
                                <PrimaryAction
                                    disabled={false}
                                    onClick={() => 
                                        this.openSubscriptionModal()
                                    }
                                    label={'Upgrade to Memex Pro'}
                                />
                            )}
                        </div>
                    </div>
                    {this.state.subscribeModal && (
                        <SubscribeModal onClose={this.closeSubscriptionModal} />
                    )}
                </div>
            </div>
        )
    }
}

export default withCurrentUser(SetupManualOrAutomatic)

SetupManualOrAutomatic.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onBackRequested: PropTypes.func.isRequired,
    onSubscribeRequested: PropTypes.func.isRequired,
    authorizedFeatures: PropTypes.array.isRequired,
}
