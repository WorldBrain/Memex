import React, { PureComponent } from 'react'
import { browser } from 'webextension-polyfill-ts'

const styles = require('./CongratsMessage.css')

const partyPopperIcon = browser.runtime.getURL('/img/party_popper.svg')

class CongratsMessage extends PureComponent {
    moreAboutSidebar = () => {
        browser.tabs.create({
            url: 'https://worldbrain.io',
        })
    }

    goToDashboard = () => {
        browser.tabs.create({
            url: browser.runtime.getURL('/options.html#/overview'),
        })
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
                        CONGRATS TO YOUR FIRST ANNOTATION
                    </p>
                </div>
                <div
                    className={styles.learnMore}
                    onClick={this.moreAboutSidebar}
                >
                    Learn more about the sidebar
                </div>
                <p className={styles.subtext} onClick={this.goToDashboard}>
                    or go back to dashboard
                </p>
            </div>
        )
    }
}

export default CongratsMessage
