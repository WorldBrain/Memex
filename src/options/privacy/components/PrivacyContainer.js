import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from '../constants'
import Privacy from './Privacy'

class PrivacyContainer extends React.PureComponent {
    static DEF_TRACKING = true

    static propTypes = {
        trackChange: PropTypes.func.isRequired,
    }

    async componentDidMount() {
        const storage = await browser.storage.local.get({
            [SHOULD_TRACK]: PrivacyContainer.DEF_TRACKING,
        })

        this.props.trackChange(storage[SHOULD_TRACK], true)
    }

    handleTrackChange = async event => {
        const shouldTrack =
            event.target.value === 'y' || event.target.value === true

        if (shouldTrack) {
            browser.storage.local.set({ [SHOULD_TRACK]: shouldTrack })
            await this.props.trackChange(shouldTrack)
        } else {
            await this.props.trackChange(shouldTrack)
            browser.storage.local.set({ [SHOULD_TRACK]: shouldTrack })
        }
    }

    render() {
        return (
            <Privacy
                handleTrackChange={this.handleTrackChange}
                {...this.props}
            />
        )
    }
}

const mapStateToProps = state => ({
    shouldTrack: selectors.shouldTrack(state),
})

const mapDispatchToProps = dispatch => ({
    trackChange: (shouldTrack, skipEventTrack = false) =>
        dispatch(actions.toggleTrackingOptOut(shouldTrack, skipEventTrack)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(PrivacyContainer)
