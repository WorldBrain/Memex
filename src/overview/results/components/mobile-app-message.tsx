import React from 'react'

import ResultsMessage from './results-message-dismissible'
import MobileAppAd from 'src/sync/components/device-list/mobile-app-ad'

const styles = require('./mobile-app-message.css')

export interface Props {}

export default class MobileAppMessage extends React.PureComponent<Props> {
    private handleDismiss = () => {
        localStorage.setItem('stage.MobileAppAd', 'false')
    }

    render() {
        return (
            <ResultsMessage
                className={styles.container}
                onDismiss={this.handleDismiss}
            >
                <MobileAppAd />
            </ResultsMessage>
        )
    }
}
