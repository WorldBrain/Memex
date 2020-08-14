import React, { PureComponent } from 'react'
import styled from 'styled-components'
const styles = require('./TrialExpiryWarning.css')
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'


interface Props {
	showPaymentWindow: () => void
	expiryDate: any
	closeTrialNotif: () => void
    loadingPortal: boolean
}

class TrialExpiryWarning extends PureComponent<Props> {

	getExpiryinClearLanguage() {
		const dateNow = Math.floor(new Date().getTime() / 1000);

		const expiryDays = Math.floor((this.props.expiryDate - dateNow)/ 86400)
		
		return expiryDays
	}

    render() {
        return (
            <div id="TrialExpiryWarning" className={styles.box}>
            	Your trial is expiring in <strong>{this.getExpiryinClearLanguage()}</strong> days
            	<span
            		onClick={this.props.showPaymentWindow}
            		className={styles.closeButton}
            	>{this.props.loadingPortal ? (
                                <LoadingIndicator/>
                    ):('Update Payment Methods'
                )}
                </span>

                <span
                    onClick={this.props.closeTrialNotif}
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
