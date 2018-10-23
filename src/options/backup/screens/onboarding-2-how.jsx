import React from 'react'
import PropTypes from 'prop-types'
import { OnboardingBackupMode } from '../components/onboarding-backup-mode'
import { PrimaryButton } from '../components/primary-button'

export default class OnboardingHowContainer extends React.Component {
    state = { mode: null, billingPeriod: null }

    render() {
        return (
            <div>
                <h2>How?</h2>
                TODO: improve copywriting of this intro
                <OnboardingBackupMode
                    mode={this.state.mode}
                    billingPeriod={this.state.billingPeriod}
                    onModeChange={mode => this.setState({ mode })}
                    onBillingPeriodChange={billingPeriod =>
                        this.setState({ billingPeriod })
                    }
                />
                <span onClick={this.props.onBackRequested}>Back</span>
                {this.state.mode === 'manual' && (
                    <PrimaryButton
                        onClick={() => this.props.onChoice({ type: 'manual' })}
                    >
                        Calculate size
                    </PrimaryButton>
                )}
                {this.state.mode === 'automatic' && (
                    <PrimaryButton
                        disabled={!this.state.billingPeriod}
                        onClick={() =>
                            this.props.onChoice({
                                type: 'automatic',
                                billingPeriod: this.state.billingPeriod,
                            })
                        }
                    >
                        Payment
                    </PrimaryButton>
                )}
            </div>
        )
    }
}

OnboardingHowContainer.propTypes = {
    onChoice: PropTypes.func.isRequired,
    onBackRequested: PropTypes.func.isRequired,
}
