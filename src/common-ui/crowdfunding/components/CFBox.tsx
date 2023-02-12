import React, { PureComponent, MouseEventHandler } from 'react'

import { remoteFunction } from '../../../util/webextensionRPC'
import Message from './Message'

const styles = require('./CFBox.css')

export interface Props {
    onClose: MouseEventHandler<HTMLDivElement>
}

class CrowdfundingBox extends PureComponent<Props> {
    private _openLearnMoreUrl = remoteFunction('openLearnMoreTab')

    private _openNewLink = async () => {
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
