import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as selectors from './selectors'
import * as actions from './actions'
import Importer from './components/Importer'
import ImportMsg from './components/ImportMsg'
import Overlay from './components/Overlay'
import Info from './components/Info'

class OnboardingContainer extends PureComponent {
    static propTypes = {
        isImportsDone: PropTypes.bool.isRequired,
        isVisible: PropTypes.bool.isRequired,
        setVisible: PropTypes.func.isRequired,
        initConnection: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)

        // Init the connection to imports module in BG script
        this._importsConnMan = this.props.initConnection()
    }

    cancelImport = () => this._importsConnMan.cancel()

    renderImportMsg() {
        const props = this.props.isImportsDone
            ? {
                  children: 'Memex is ready! Click here to start.',
                  onClick: this.props.setVisible(false),
              }
            : {
                  children:
                      'Please wait while Memex prepares... (click to skip)',
                  onClick: this.cancelImport,
              }
        return <ImportMsg {...props} />
    }

    render() {
        if (!this.props.isVisible) {
            return null
        }

        return (
            <Overlay>
                <Info />
                <Importer {...this.props}>{this.renderImportMsg()}</Importer>
            </Overlay>
        )
    }
}

const mapStateToProps = state => ({
    isVisible: selectors.isVisible(state),
    isImportsDone: selectors.isImportsDone(state),
    progress: selectors.progressPercent(state),
})

const mapDispatchToProps = dispatch => ({
    setVisible: flag => () => dispatch(actions.setVisible(flag)),
    initConnection: () => dispatch(actions.init()),
})

export default connect(mapStateToProps, mapDispatchToProps)(OnboardingContainer)
