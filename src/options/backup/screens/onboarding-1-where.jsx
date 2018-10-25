import React from 'react'
import PropTypes from 'prop-types'
import { ProviderList } from '../components/provider-list'
import { PrimaryButton } from '../components/primary-button'
import Styles from '../styles.css'

export default class OnboardingWhere extends React.Component {
    state = { provider: null }

    render() {
        return (
            <div>
                <p className={Styles.header2}>
                    <strong>STEP 1/5: </strong>
                    WHERE?
                </p>
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
