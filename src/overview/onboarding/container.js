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
        showCancelBtn: PropTypes.bool.isRequired,
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
    }

    cancelImport = () => this._importsConnMan.cancel()

    handleClose = event => {
        this.cancelImport()
        this.props.setVisible(false)()
    }

    render() {
        if (!this.props.isVisible) {
            return null
        }

        return (
            <Overlay
                onClose={this.handleClose}
                showCloseBtn={this.props.showCancelBtn}
            >
                <Importer {...this.props}>
                    <ImportMsg
                        isImportsDone={this.props.isImportsDone}
                        onCancel={this.cancelImport}
                        onFinish={this.props.setVisible(false)}
                    />
                </Importer>
                <Info />
                <OptIn>
                    <ToggleSwitch
                        isChecked={this.props.shouldTrack}
                        onChange={this.props.toggleShouldTrack}
                    />
                </OptIn>
            </Overlay>
        )
    }
}

const mapStateToProps = state => ({
    isVisible: selectors.isVisible(state),
    isImportsDone: selectors.isImportsDone(state),
    showCancelBtn: selectors.showCancelBtn(state),
    progress: selectors.progressPercent(state),
    shouldTrack: selectors.shouldTrack(state),
})

const mapDispatchToProps = dispatch => ({
    setVisible: flag => () => dispatch(actions.setVisible(flag)),
    initConnection: () => dispatch(actions.init()),
    toggleShouldTrack: () => dispatch(actions.toggleShouldTrack()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(OnboardingContainer)
