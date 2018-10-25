import React from 'react'
import PropTypes from 'prop-types'
import Styles from './backup-mode.css'
import cx from 'classnames'

export function OnboardingBackupMode({
    mode,
    billingPeriod,
    onModeChange,
    onBillingPeriodChange,
    showPrice,
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
                    <span className={Styles.option}>
                        <span className={Styles.name}>Manual Backup</span>
                        <span className={cx(Styles.label, Styles.labelFree)}>
                            Free
                        </span>
                        <br />
                        <span className={Styles.subname}>
                            You need to regularly remember to back up yourself.
                        </span>
                    </span>
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="radio"
                        checked={mode === 'automatic'}
                        onChange={() => onModeChange('automatic')}
                    />{' '}
                    <span className={Styles.option}>
                        <span className={Styles.name}>Automatic Backup</span>
                        <span className={cx(Styles.label, Styles.labelPremium)}>
                            <i className={cx('material-icons', Styles.star)}>
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
                {showPrice && (
                    <div style={{ marginLeft: '40px' }}>
                        <div>
                            <label>
                                <input
                                    type="radio"
                                    checked={billingPeriod === 'yearly'}
                                    disabled={mode !== 'automatic'}
                                    onChange={() =>
                                        onBillingPeriodChange('yearly')
                                    }
                                />
                                <span className={Styles.price}>12 &euro;</span>
                                <span className={Styles.period}> yearly</span>
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
                                <span className={Styles.price}>1,5 &euro;</span>
                                <span className={Styles.period}> monthly</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

OnboardingBackupMode.propTypes = {
    mode: PropTypes.string,
    billingPeriod: PropTypes.string,
    onModeChange: PropTypes.func.isRequired,
    onBillingPeriodChange: PropTypes.func.isRequired,
    showPrice: PropTypes.bool,
}
