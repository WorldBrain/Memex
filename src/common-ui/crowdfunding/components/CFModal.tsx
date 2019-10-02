import React, { PureComponent, MouseEventHandler } from 'react'
import { browser, Tabs } from 'webextension-polyfill-ts'

import { remoteFunction } from '../../../util/webextensionRPC'
import { Overlay } from '../../components'
import Message from './Message'
import { EVENT_NAMES } from '../../../analytics/internal/constants'

const styles = require('./CFModal.css')

export interface Props {
    onClose: MouseEventHandler<HTMLSpanElement>
    tabs: Tabs.Static
    learnMoreUrl: string
    context: string
}

class CrowdfundingOverlay extends PureComponent<Props> {
    static defaultProps: Pick<Props, 'tabs' | 'learnMoreUrl'> = {
        tabs: browser.tabs,
        learnMoreUrl: 'https://worldbrain.io/pricing/',
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
            <Overlay
                className={styles.background}
                innerClassName={styles.popup}
                onClick={this.props.onClose}
            >
                <span className={styles.close} onClick={this.props.onClose} />
                <Message
                    styles={styles}
                    context={this.props.context}
                    openNewLink={this.openNewLink}
                />
            </Overlay>
        )
    }
}

export default CrowdfundingOverlay
