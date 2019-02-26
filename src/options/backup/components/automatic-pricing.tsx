import React, { PureComponent } from 'react'

interface Props {
    billingPeriod: string
    mode: string
    onBillingPeriodChange: (type: string) => void
}

const styles = require('./backup-mode.css')

export default class AutomaticPricing extends PureComponent<Props, {}> {
    render() {
        const { billingPeriod, mode, onBillingPeriodChange } = this.props
        return (
            <div>
                <div>
                    <label>
                        <input
                            type="radio"
                            checked={billingPeriod === 'yearly'}
                            disabled={mode !== 'automatic'}
                            onChange={() => onBillingPeriodChange('yearly')}
                        />
                        <span className={styles.price}>12 &euro;</span>
                        <span className={styles.period}> yearly</span>
                    </label>
                </div>
                <div>
                    <label>
                        <input
                            type="radio"
                            checked={billingPeriod === 'monthly'}
                            disabled={mode !== 'automatic'}
                            onChange={() => onBillingPeriodChange('monthly')}
                        />
                        <span className={styles.price}>1,5 &euro;</span>
                        <span className={styles.period}> monthly</span>
                    </label>
                </div>
            </div>
        )
    }
}
