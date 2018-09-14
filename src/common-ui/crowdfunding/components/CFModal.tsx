import React, { PureComponent, MouseEventHandler } from 'react'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../../../util/webextensionRPC'
import { Overlay } from '../../components'

const styles = require('./CFModal.css')

export interface Props {
    onClose: MouseEventHandler
    tabs: Tabs.Static
    learnMoreUrl: string
    context: string
}

class CrowdfundingOverlay extends PureComponent<Props> {
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
            <Overlay
                className={styles.background}
                innerClassName={styles.popup}
                onClick={this.props.onClose}
            >
                <span className={styles.close} onClick={this.props.onClose} />
                <p className={styles.header}>Fund the future!</p>
                <p className={styles.bolderText}>
                    Unfortunately you can't share <br /> and discuss{' '}
                    {this.props.context} yet.
                </p>
                <p className={styles.text}>
                    Support the development with 10€ and <br />
                    <b>get back 30€</b> worth of Memex Premium Credits.
                </p>
                <a className={styles.learnMore} onClick={this.openNewLink}>
                    LEARN MORE
                </a>
            </Overlay>
        )
    }
}

export default CrowdfundingOverlay
