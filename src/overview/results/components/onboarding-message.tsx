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

    render() {
        return (
            <ResultsMessage>
                <p className={styles.mainText}>
                    Welcome to Memex! It looks like you don't have any content
                    indexed yet...
                </p>
                {this.state.showTooltip && (
                    <OnboardingTooltip
                        descriptionText="Import your existing bookmarks &amp; web history from Pocket, Diigo, Raindrop.io and many more."
                        CTAText="Import"
                        onCTAClick={() => (window.location.hash = '#/import')}
                        onDismiss={() =>
                            this.setState(() => ({ showTooltip: false }))
                        }
                    />
                )}
            </ResultsMessage>
        )
    }
}
