import React, { PureComponent, MouseEventHandler } from 'react'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../../../util/webextensionRPC'

const styles = require('./CFBox.css')

export interface Props {
    onClose: MouseEventHandler
    tabs: Tabs.Static
    learnMoreUrl: string
}

class CrowdfundingBox extends PureComponent<Props> {
    static defaultProps: Pick<Props, 'tabs' | 'learnMoreUrl'> = {
        tabs: browser.tabs,
        learnMoreUrl:
            'https://worldbrain.io/product/collaborative-annotations/',
    }

    private processEventRPC = remoteFunction('processEvent')

    private openNewLink = async () => {
        await this.processEventRPC({ type: 'learnMoreCrowdFunding' })
        this.props.tabs.create({ url: this.props.learnMoreUrl })
    }

    render() {
        return (
            <div className={styles.container}>
                <p className={styles.header}>Fund the future!</p>
                <p className={styles.boldText}>
                    Unfortunately you can't share <br /> and discuss annotations
                    yet.
                </p>
                <p className={styles.text}>
                    Support the development with 10€ and{' '}
                    <i>
                        <b>get back 30€</b>
                    </i>{' '}
                    worth in Memex Premium Credits.
                </p>
                <a className={styles.learnMore} onClick={this.openNewLink}>
                    LEARN MORE
                </a>
                <div onClick={this.props.onClose} className={styles.closeDiv}>
                    Close Notification
                </div>
            </div>
        )
    }
}

export default CrowdfundingBox
