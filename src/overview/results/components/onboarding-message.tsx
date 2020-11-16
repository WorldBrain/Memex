import React from 'react'

import ResultsMessage from './results-message-dismissible'
import OnboardingTooltip from '../../onboarding/components/onboarding-tooltip'

export interface Props {}

export default class OnboardingMessage extends React.PureComponent<Props> {
    private handleDismiss = () => {
        localStorage.setItem('stage.Onboarding', 'false')
    }

    render() {
        const descriptionText = (
            <span>
                <strong>
                    Import your bookmarks to make them full-text searchable
                </strong>{' '}
                <br /> From Pocket, Diigo, Raindrop.io and many more.
            </span>
        )

        return (
            <ResultsMessage onDismiss={this.handleDismiss}>
                <OnboardingTooltip
                    descriptionText={descriptionText}
                    CTAText="Get Started"
                    onCTAClick={() => (window.location.hash = '#/import')}
                />
            </ResultsMessage>
        )
    }
}
