import React from 'react'
import PropTypes from 'prop-types'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import { PrimaryButton } from '../components/primary-button'
import Styles from '../styles.css'
import { withCurrentUser } from 'src/authentication/components/AuthConnector'

class OnboardingHow extends React.Component {
    state = { mode: null }

    render() {
        return (
            <div>
                <p className={Styles.header2}>
                    <strong>STEP 2/5: </strong>
                    More or less work?
                </p>
                <OnboardingBackupMode
                    className={Styles.selectionlist}
                    onModeChange={mode => this.setState({ mode })}
                    launchSubscriptionFlow={this.props.onSubscribeRequested}
                    isAuthorizedForAutomaticBackup={this.props.authorizedFeatures.includes(
                        'backup',
                    )}
                />
                {this.state.mode === 'manual' && (
                    <PrimaryButton
                        onClick={() => this.props.onChoice({ type: 'manual' })}
                    >
                        Calculate size
                    </PrimaryButton>
                )}
                {this.state.mode === 'automatic' && (
                    <PrimaryButton
                        disabled={
                            !this.props.authorizedFeatures.includes('backup')
                        }
                        onClick={
                            this.props.authorizedFeatures.includes('backup')
                                ? () =>
                                      this.props.onChoice({ type: 'automatic' })
                                : () => false
                        }
                    >
                        Continue
                    </PrimaryButton>
                )}

                <span
                    className={Styles.back}
                    onClick={this.props.onBackRequested}
                >
                    Go Back
                </span>
            </div>
        )
    }
}

export default withCurrentUser(OnboardingHow)

OnboardingHow.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onBackRequested: PropTypes.func.isRequired,
    onSubscribeRequested: PropTypes.func.isRequired,
    currentUser: PropTypes.any,
    authorizedFeatures: PropTypes.array,
}
