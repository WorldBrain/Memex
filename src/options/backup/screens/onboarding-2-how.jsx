import React from 'react'
import PropTypes from 'prop-types'
import { OnboardingBackupMode } from '../components/onboarding-backup-mode'
import { PrimaryButton } from '../components/primary-button'
import Styles from '../styles.css'

export default class OnboardingHowContainer extends React.Component {
    state = { mode: null, billingPeriod: null }
    render() {
        const isAutomatic = this.state.mode === 'automatic'
        return (
            <div>
                <p className={Styles.header2}>
                    <strong>STEP 2/5: </strong>
                    HOW?
                </p>
                <OnboardingBackupMode
                    showPrice={isAutomatic}
                    mode={this.state.mode}
                    billingPeriod={this.state.billingPeriod}
                    onModeChange={mode => this.setState({ mode })}
                    onBillingPeriodChange={billingPeriod =>
                        this.setState({ billingPeriod })
                    }
                />
                {this.state.mode === 'manual' && (
                    <PrimaryButton
                        onClick={() => this.props.onChoice({ type: 'manual' })}
                    >
                        Calculate size
                    </PrimaryButton>
                )}
                {isAutomatic && (
                    <PrimaryButton
                        disabled={!this.state.billingPeriod}
                        onClick={() =>
                            this.props.onChoice({
                                type: 'automatic',
                                billingPeriod: this.state.billingPeriod,
                            })
                        }
                    >
                        Pay Now
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
}
