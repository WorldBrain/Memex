import React from 'react'
import PropTypes from 'prop-types'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'
import { PrimaryAction } from '@worldbrain/memex-common/ts/common-ui/components/PrimaryAction'
import { SecondaryAction } from 'src/common-ui/components/design-library/actions/SecondaryAction'
import { connect } from 'react-redux'
import { show } from 'src/overview/modals/actions'

class SetupManualOrAutomatic extends React.Component {
    state = {
        mode: 'automatic',
        automatic: true,
    }

    render() {
        return (
            <div>
                <div>
                    <div>
                        <strong>STEP 2/5: </strong>
                        More or less work?
                    </div>
                    <OnboardingBackupMode
                        onModeChange={(mode) => this.setState({ mode })}
                        showSubscriptionModal={this.props.showSubscriptionModal}
                        isAuthorizedForAutomaticBackup={this.state.automatic}
                    />
                    <div>
                        <SecondaryAction
                            onClick={this.props.onBackRequested}
                            label={'Go Back'}
                        />
                        <div>
                            {this.state.mode === 'manual' && (
                                <PrimaryAction
                                    onClick={() =>
                                        this.props.onChoice({ type: 'manual' })
                                    }
                                    label={'Continue'}
                                />
                            )}
                            {this.state.mode === 'automatic' && (
                                <PrimaryAction
                                    disabled={false}
                                    onClick={() =>
                                        this.props.onChoice({
                                            type: 'automatic',
                                        })
                                    }
                                    label={'Next'}
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
    showSubscriptionModal: PropTypes.func.isRequired,
    // currentUser: PropTypes.object.isRequired,
}
