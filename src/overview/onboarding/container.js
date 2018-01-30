import React, { Component } from 'react'
import PropTypes from 'prop-types'

import Importer from './components/Importer'
import Overlay from './components/Overlay'
import Info from './components/Info'

class OnboardingContainer extends Component {
    static propTypes = {}

    state = {
        show: true,
    }

    onClose = event =>
        console.log(event) ||
        this.setState(state => ({ ...state, show: false }))

    render() {
        return (
            <Overlay>
                <Info />
                <Importer />
            </Overlay>
        )
    }
}

export default OnboardingContainer
