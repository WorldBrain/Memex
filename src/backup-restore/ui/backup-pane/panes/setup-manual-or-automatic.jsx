import React from 'react'
import PropTypes from 'prop-types'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import { PrimaryButton } from '../../../../common-ui/components/primary-button'
import Styles from '../../styles.css'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'

const settingsStyle = require('src/options/settings/components/settings.css')

class SetupManualOrAutomatic extends React.Component {
    state = { mode: null }

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
                                    label={'Contine'}
                                />
                            )}
                            {this.state.mode === 'automatic' && (
                                <PrimaryButton
                                    disabled={!isAuthorizedForAutomaticBackup}
                                    onClick={
                                        isAuthorizedForAutomaticBackup
                                            ? () =>
                                                  this.props.onChoice({ type: 'automatic' })
                                            : () => false
                                    }
                                    label={'Continue'}
                                />
                            )}
                        </div>
                    </div>
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
