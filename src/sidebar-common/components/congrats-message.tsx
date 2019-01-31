import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { remoteFunction } from 'src/util/webextensionRPC'
import { openInNewTab } from '../utils'

const styles = require('./congrats-message.css')

let partyPopperIcon
try {
    partyPopperIcon = browser.runtime.getURL('/img/party_popper.svg')
} catch (e) {
    partyPopperIcon = '/img/party_popper.svg'
}

class CongratsMessage extends PureComponent {
    openOptionsTab = remoteFunction('openOptionsTab')

    moreAboutSidebar = () => {
        openInNewTab('https://worldbrain.io')
    }

    goToDashboard = () => {
        let url
        try {
            url = browser.runtime.getURL('/options.html#/overview')
        } catch (e) {
            url = '/options.html#/overview'
        }
        openInNewTab(url)
    }

    render() {
        return (
            <div className={styles.container}>
                <div className={styles.firstRow}>
                    <img
                        src={partyPopperIcon}
                        alt="🎉"
                        className={styles.partyPopper}
                    />
                    <p className={styles.title}>
                        Congrats on your first annotation
                    </p>
                </div>
                <div className={styles.learnMore} onClick={this.goToDashboard}>
                    Go back to Dashboard
                </div>
            </div>
        )
    }
}

export default CongratsMessage
