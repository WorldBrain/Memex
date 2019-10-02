import React, { PureComponent, MouseEventHandler } from 'react'

import { remoteFunction } from '../../../util/webextensionRPC'
import Message from './Message'
import { EVENT_NAMES } from '../../../analytics/internal/constants'

const styles = require('./CFBox.css')

export interface Props {
    onClose: MouseEventHandler<HTMLDivElement>
}

class CrowdfundingBox extends PureComponent<Props> {
    private _processEventRPC = remoteFunction('processEvent')
    private _openLearnMoreUrl = remoteFunction('openLearnMoreTab')

    private _openNewLink = async () => {
        await this._processEventRPC({
            type: EVENT_NAMES.LEARN_MORE_CROWD_FUNDING,
        })
        await this._openLearnMoreUrl()
    }

    render() {
        return (
            <div className={styles.container}>
                <Message
                    styles={styles}
                    context="annotations"
                    openNewLink={this._openNewLink}
                />
                <div onClick={this.props.onClose} className={styles.closeDiv}>
                    Close Notification
                </div>
            </div>
        )
    }
}

export default CrowdfundingBox
