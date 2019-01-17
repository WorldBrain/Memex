import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'
import { remoteFunction } from 'src/util/webextensionRPC'

const styles = require('./congrats-message.css')

const partyPopperIcon = browser.runtime.getURL('/img/party_popper.svg')

class CongratsMessage extends PureComponent {
    openOptionsTab = remoteFunction('openOptionsTab')

    moreAboutSidebar = () => {
        browser.tabs.create({
            url: 'https://worldbrain.io',
        })
    }

    goToDashboard = () => this.openOptionsTab('overview')

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
