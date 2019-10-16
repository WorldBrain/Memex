import React from 'react'
import PropTypes from 'prop-types'
import OnboardingBackupMode from '../components/onboarding-backup-mode'
import { PrimaryButton } from '../components/primary-button'
import Styles from '../styles.css'

export default class OnboardingHowContainer extends React.Component {
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
                        disabled
                        onClick={() =>
                            this.props.onChoice({ type: 'automatic' })
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

OnboardingHowContainer.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onBackRequested: PropTypes.func.isRequired,
    onSubscribeRequested: PropTypes.func.isRequired,
}
