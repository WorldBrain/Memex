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
                    title="Import"
                    CTAText="Import"
                    onCTAClick={() => (window.location.hash = '#/import')}
                    imgSrc="/img/onboarding-tutorials/import.svg"
                >
                    <p>
                        Import your existing bookmarks &amp; web history from
                        Pocket, Diigo, Raindrop.io and many more
                    </p>
                </OnboardingTooltip>
            </ResultsMessage>
        )
    }
}
