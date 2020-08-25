import React, { PureComponent } from 'react'
import styled from 'styled-components'
const styles = require('./TrialExpiryWarning.css')
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'

interface Props {
    showPaymentWindow: () => void
    expiryDate: any
    closeTrialNotif: () => void
    loadingPortal: boolean
    trialOverClosed: () => void
}

class TrialExpiryWarning extends PureComponent<Props> {
    state = {
        expired: false,
    }

    getExpiryinClearLanguage() {
        const dateNow = Math.floor(new Date().getTime() / 1000)

        const expiryDays = Math.floor((this.props.expiryDate - dateNow) / 86400)

        if (expiryDays < 1) {
            const expiryHours = Math.floor(
                (this.props.expiryDate - dateNow) / 3600,
            )
            return expiryHours + ' ' + 'hours'
        } else if (expiryDays > 1) {
            return expiryDays + ' ' + 'days'
        } else if (expiryDays === 1) {
            return expiryDays + ' ' + 'day'
        } else if (expiryDays < 0) {
            this.setState({ expired: true })
        }
    }

    closeButton() {
        if (this.state.expired) {
            this.props.trialOverClosed()
        } else {
            this.props.closeTrialNotif()
        }
    }

    render() {
        return (
            <div id="TrialExpiryWarning" className={styles.box}>
                {this.state.expired ? (
                    <span>
                        {'Your trial EXPIRED. Premium features disabled'}
                    </span>
                ) : (
                    <span>
                        Your trial is expiring in{' '}
                        <strong>{this.getExpiryinClearLanguage()}</strong>
                    </span>
                )}
                <span
                    onClick={this.props.showPaymentWindow}
                    className={styles.closeButton}
                >
                    {this.props.loadingPortal ? (
                        <LoadingIndicator />
                    ) : (
                        <span>
                            {this.state.expired
                                ? 'Reactivate'
                                : 'Update Payment Methods'}
                        </span>
                    )}
                </span>

                {}
                <span
                    onClick={() => this.closeButton()}
                    className={styles.closeButton}
                >
                    Close
                </span>
                {/*<span
                        onClick={this.props.closeTrialNotif}
                        className={styles.closeButton}
                    >close</span>*/}
            </div>
        )
    }
}

export default TrialExpiryWarning
