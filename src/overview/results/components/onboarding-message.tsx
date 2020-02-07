import React from 'react'

import ResultsMessage from './ResultsMessage'
import OnboardingTooltip from '../../onboarding/components/onboarding-tooltip'

const styles = require('./onboarding-message.css')

export interface Props {}

interface State {
    showTooltip: boolean
}

export default class OnboardingMessage extends React.PureComponent<
    Props,
    State
> {
    state: State = { showTooltip: true }

    private dismiss = () => {
        localStorage.setItem('stage.Onboarding', 'false')
        this.setState(() => ({ showTooltip: false }))
    }

    render() {
        return (
            <ResultsMessage>
                {this.state.showTooltip && (
                    <OnboardingTooltip
                        descriptionText="Import your existing bookmarks &amp; web history from Pocket, Diigo, Raindrop.io and many more."
                        CTAText="Import"
                        onCTAClick={() => (window.location.hash = '#/import')}
                        onDismiss={this.dismiss}
                    />
                )}
            </ResultsMessage>
        )
    }
}
