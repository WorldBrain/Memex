import React, { PureComponent, MouseEventHandler } from 'react'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../../../util/webextensionRPC'
import Message from './Message'
import { EVENT_NAMES } from '../../../analytics/internal/constants'

const styles = require('./CFBox.css')

export interface Props {
    onClose: MouseEventHandler
    tabs?: Tabs.Static
    learnMoreUrl?: string
}

class CrowdfundingBox extends PureComponent<Props> {
    static defaultProps: Pick<Props, 'tabs' | 'learnMoreUrl'> = {
        tabs: browser.tabs,
        learnMoreUrl: 'https://worldbrain.io/pricing',
    }

    private processEventRPC = remoteFunction('processEvent')

    private openNewLink = async () => {
        await this.processEventRPC({
            type: EVENT_NAMES.LEARN_MORE_CROWD_FUNDING,
        })
        this.props.tabs.create({ url: this.props.learnMoreUrl })
    }

    render() {
        return (
            <div className={styles.container}>
                <Message
                    styles={styles}
                    context="annotations"
                    openNewLink={this.openNewLink}
                />
                <div onClick={this.props.onClose} className={styles.closeDiv}>
                    Close Notification
                </div>
            </div>
        )
    }
}

export default CrowdfundingBox
