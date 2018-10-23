import React from 'react'
import PropTypes from 'prop-types'
import { ProviderList } from '../components/provider-list'
import { PrimaryButton } from '../components/primary-button'

export default class OnboardingWhere extends React.Component {
    state = { provider: null }

    render() {
        return (
            <div>
                <h2>Where?</h2>
                <ProviderList
                    onChange={provider => this.setState({ provider })}
                />
                <PrimaryButton
                    disabled={!this.state.provider}
                    onClick={() => this.props.onChoice(this.state.provider)}
                >
                    Continue
                </PrimaryButton>
            </div>
        )
    }
}

OnboardingWhere.propTypes = {
    onChoice: PropTypes.func.isRequired,
}
