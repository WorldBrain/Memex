import React from 'react'

import ResultsMessage from './results-message-dismissible'
import OnboardingTooltip from '../../onboarding/components/onboarding-tooltip'

export interface Props {}

export default class OnboardingMessage extends React.PureComponent<Props> {
    private handleDismiss = () => {
        localStorage.setItem('stage.Onboarding', 'false')
    }

    render() {
        return (
            <ResultsMessage onDismiss={this.handleDismiss}>
                <OnboardingTooltip
                    descriptionText="Import your existing bookmarks &amp; web history from Pocket, Diigo, Raindrop.io and many more."
                    CTAText="Import"
                    onCTAClick={() => (window.location.hash = '#/import')}
                />
            </ResultsMessage>
        )
    }
}
