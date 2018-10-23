import React from 'react'
import PropTypes from 'prop-types'

export function OnboardingBackupMode({
    mode,
    billingPeriod,
    onModeChange,
    onBillingPeriodChange,
}) {
    return (
        <div>
            <div>
                <label>
                    <input
                        type="radio"
                        checked={mode === 'manual'}
                        onChange={() => onModeChange('manual')}
                    />{' '}
                    Manual backup
                    <br />
                </label>
                You need to remember to back up and press a button.
            </div>
            <div>
                <label>
                    <input
                        type="radio"
                        checked={mode === 'automatic'}
                        onChange={() => onModeChange('automatic')}
                    />{' '}
                    Automatic backup
                    <br />
                </label>
                TODO: improve copywriting.
                <div style={{ marginLeft: '40px' }}>
                    <div>
                        <label>
                            <input
                                type="radio"
                                checked={billingPeriod === 'yearly'}
                                disabled={mode !== 'automatic'}
                                onChange={() => onBillingPeriodChange('yearly')}
                            />
                            Pay yearly: 12&euro;
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="radio"
                                checked={billingPeriod === 'monthly'}
                                disabled={mode !== 'automatic'}
                                onChange={() =>
                                    onBillingPeriodChange('monthly')
                                }
                            />
                            Pay monthly: 1.50&euro;
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}

OnboardingBackupMode.propTypes = {
    mode: PropTypes.string,
    billingPeriod: PropTypes.string,
    onModeChange: PropTypes.func.isRequired,
    onBillingPeriodChange: PropTypes.func.isRequired,
}
