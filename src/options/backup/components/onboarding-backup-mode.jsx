import React from 'react'
import PropTypes from 'prop-types'
import Styles from './backup-mode.css'
import classNames from 'classnames'

import AutomaticPricing from './automatic-pricing'

export default class OnboardingBackupModeContainer extends React.Component {
    static propTypes = {
        disableModeSelection: PropTypes.bool,
        billingPeriod: PropTypes.string,
        onModeChange: PropTypes.func,
        onBillingPeriodChange: PropTypes.func.isRequired,
    }

    state = {
        mode: null,
        billingPeriod: null,
    }

    componentDidMount() {
        if (this.props.disableModeSelection) {
            this.setState({ mode: 'automatic' })
        }
    }

    render() {
        return (
            <OnboardingBackupMode
                {...this.props}
                disableModeSelection={this.props.disableModeSelection}
                mode={this.state.mode}
                billingPeriod={this.state.billingPeriod}
                showPrice={this.state.mode === 'automatic'}
                onModeChange={mode => {
                    this.setState({ mode })
                    this.props.onModeChange && this.props.onModeChange(mode)
                }}
                onBillingPeriodChange={billingPeriod => {
                    this.setState({ billingPeriod })
                    this.props.onBillingPeriodChange(billingPeriod)
                }}
            />
        )
    }
}

export function OnboardingBackupMode({
    disableModeSelection,
    mode,
    billingPeriod,
    onModeChange,
    onBillingPeriodChange,
    showPrice,
}) {
    return (
        <div>
            {!disableModeSelection && (
                <div>
                    <label>
                        <input
                            type="radio"
                            checked={mode === 'manual'}
                            onChange={() => onModeChange('manual')}
                        />{' '}
                        <span className={Styles.option}>
                            <span className={Styles.name}>Manual Backup</span>
                            <span
                                className={classNames(
                                    Styles.label,
                                    Styles.labelFree,
                                )}
                            >
                                Free
                            </span>
                            <br />
                            <span className={Styles.subname}>
                                You need to regularly remember to back up
                                yourself.
                            </span>
                        </span>
                    </label>
                </div>
            )}
            <div>
                {!disableModeSelection && (
                    <label>
                        <input
                            type="radio"
                            checked={mode === 'automatic'}
                            onChange={() => onModeChange('automatic')}
                        />{' '}
                        <span className={Styles.option}>
                            <span className={Styles.name}>
                                Automatic Backup
                            </span>
                            <span
                                className={classNames(
                                    Styles.label,
                                    Styles.labelPremium,
                                )}
                            >
                                <i
                                    className={classNames(
                                        'material-icons',
                                        Styles.star,
                                    )}
                                >
                                    star
                                </i>
                                Premium
                            </span>
                            <br />
                            <span className={Styles.subname}>
                                Worry-free backups every 15 minutes.
                            </span>
                        </span>
                    </label>
                )}
                {showPrice && (
                    <AutomaticPricing
                        billingPeriod={billingPeriod}
                        mode={mode}
                        onBillingPeriodChange={onBillingPeriodChange}
                    />
                )}
            </div>
        </div>
    )
}

OnboardingBackupMode.propTypes = {
    disableModeSelection: PropTypes.bool,
    mode: PropTypes.string,
    billingPeriod: PropTypes.string,
    onModeChange: PropTypes.func.isRequired,
    onBillingPeriodChange: PropTypes.func.isRequired,
    showPrice: PropTypes.bool,
}
