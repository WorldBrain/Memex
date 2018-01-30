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
        initConnection: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)

        // Init the connection to imports module in BG script
        this._importsConnMan = this.props.initConnection()
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
    initConnection: () => dispatch(actions.init()),
})

export default connect(mapStateToProps, mapDispatchToProps)(OnboardingContainer)
