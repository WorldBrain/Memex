import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { ToggleSwitch } from 'src/common-ui/components'
import * as selectors from './selectors'
import * as actions from './actions'
import Importer from './components/Importer'
import ImportMsg from './components/ImportMsg'
import Overlay from './components/Overlay'
import Info from './components/Info'
import OptIn from './components/OptIn'

class OnboardingContainer extends PureComponent {
    static propTypes = {
        isImportsDone: PropTypes.bool.isRequired,
        isVisible: PropTypes.bool.isRequired,
        shouldTrack: PropTypes.bool.isRequired,
        toggleShouldTrack: PropTypes.func.isRequired,
        setVisible: PropTypes.func.isRequired,
        initConnection: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props)

        // Init the connection to imports module in BG script
        this._importsConnMan = this.props.initConnection()

        // Chrome users don't need to see the switch; FF do
        this._showTrackingOptIn =
            typeof browser.runtime.getBrowserInfo !== 'undefined'
    }

    cancelImport = () => this._importsConnMan.cancel()

    handleTrackingChange = event => console.log(event.target.value)

    renderImportMsg() {
        const props = this.props.isImportsDone
            ? {
                  children: 'Memex is ready! Click here to start.',
                  onClick: this.props.setVisible(false),
              }
            : {
                  children:
                      'Importing the last 30 pages you visited, so you can play around immediately (click to skip)',
                  onClick: this.cancelImport,
              }
        return <ImportMsg {...props} />
    }

    renderOptIn() {
        if (!this._showTrackingOptIn) {
            return null
        }

        return (
            <OptIn>
                <ToggleSwitch
                    isChecked={this.props.shouldTrack}
                    onChange={this.props.toggleShouldTrack}
                />
            </OptIn>
        )
    }

    render() {
        if (!this.props.isVisible) {
            return null
        }

        return (
            <Overlay>
                {this.renderOptIn()}
                <Importer {...this.props}>{this.renderImportMsg()}</Importer>
                <hr />
                <Info />
            </Overlay>
        )
    }
}

const mapStateToProps = state => ({
    isVisible: selectors.isVisible(state),
    isImportsDone: selectors.isImportsDone(state),
    progress: selectors.progressPercent(state),
    shouldTrack: selectors.shouldTrack(state),
})

const mapDispatchToProps = dispatch => ({
    setVisible: flag => () => dispatch(actions.setVisible(flag)),
    initConnection: () => dispatch(actions.init()),
    toggleShouldTrack: () => dispatch(actions.toggleShouldTrack()),
})

export default connect(mapStateToProps, mapDispatchToProps)(OnboardingContainer)
