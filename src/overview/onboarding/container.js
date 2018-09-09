import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { remoteFunction } from '../../util/webextensionRPC'

import { ToggleSwitch } from 'src/common-ui/components'
import * as selectors from './selectors'
import * as actions from './actions'
import Overlay from './components/Overlay'
import OptIn from './components/OptIn'
import OnboardingMsg from './components/OnboardingMsg'
import FeaturesInfo from './components/FeaturesInfo'
import FeatureInfo from './components/FeatureInfo'
import { FEATURES_INFO } from './constants'

const styles = require('./components/Onboarding.css')

class OnboardingContainer extends PureComponent {
    static propTypes = {
        showCancelBtn: PropTypes.bool.isRequired,
        // isImportsDone: PropTypes.bool.isRequired,
        isVisible: PropTypes.bool.isRequired,
        shouldTrack: PropTypes.bool.isRequired,
        toggleShouldTrack: PropTypes.func.isRequired,
        hideOnboarding: PropTypes.func.isRequired,
        init: PropTypes.func.isRequired,
        tabs: PropTypes.object,
    }

    static defaultProps = {
        tabs: browser.tabs,
    }

    componentDidMount() {
        this.props.init()
    }

    processEventRPC = remoteFunction('processEvent')

    openNewUrl = url => () => {
        this.processEventRPC({ type: 'openURLFeature' })
        this.props.tabs.create({ url })
    }

    renderFeaturesInfo = () => {
        return FEATURES_INFO.map((feature, index) => (
            <FeatureInfo
                key={index}
                heading={feature.heading}
                subheading={feature.subheading}
                handleClick={this.openNewUrl(feature.url)}
            />
        ))
    }

    renderOptIn = () => {
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
            <Overlay
                onClose={this.props.hideOnboarding}
                showCloseBtn={this.props.showCancelBtn}
            >
                <OnboardingMsg onFinish={this.props.hideOnboarding} />
                <div>
                    <div className={styles.tutorialTitle}>
                        Explore what you can do
                    </div>
                    <FeaturesInfo optInManager={this.renderOptIn()}>
                        {this.renderFeaturesInfo()}
                    </FeaturesInfo>
                </div>
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
    hideOnboarding: () => dispatch(actions.hideOnboarding()),
    init: () => dispatch(actions.init()),
    toggleShouldTrack: () => dispatch(actions.toggleShouldTrack()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(OnboardingContainer)
