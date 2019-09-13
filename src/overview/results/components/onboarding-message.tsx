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
                    You don't have any content indexed yet...
                </p>
                {this.state.showTooltip && (
                    <OnboardingTooltip
                        titleText="Import"
                        descriptionText="Import history and content from other services."
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
