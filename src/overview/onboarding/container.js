import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as selectors from './selectors'
import * as actions from './actions'
import Importer from './components/Importer'
import Overlay from './components/Overlay'
import Info from './components/Info'

class OnboardingContainer extends PureComponent {
    static propTypes = {
        isVisible: PropTypes.bool.isRequired,
        setVisible: PropTypes.func.isRequired,
    }

    render() {
        if (!this.props.isVisible) {
            return null
        }

        return (
            <Overlay>
                <Info onClose={this.props.setVisible(false)} />
                <Importer />
            </Overlay>
        )
    }
}

const mapStateToProps = state => ({
    isVisible: selectors.isVisible(state),
})

const mapDispatchToProps = dispatch => ({
    setVisible: flag => () => dispatch(actions.setVisible(flag)),
})

export default connect(mapStateToProps, mapDispatchToProps)(OnboardingContainer)
