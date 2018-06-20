import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Sidebar from 'src/sidebar-overlay/'
import * as selectors from './selectors'
import * as actions from './actions'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool.isRequired,
        setShowSidebar: PropTypes.func.isRequired,
        toggleMouseOnSidebar: PropTypes.func.isRequired,
    }

    render() {
        return (
            <div>
                <Sidebar {...this.props} env={'overview'} />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    showSidebar: selectors.showSidebar(state),
})

const mapDispatchToProps = dispatch => ({
    setShowSidebar: showSidebar =>
        dispatch(actions.setShowSidebar(showSidebar)),
    toggleMouseOnSidebar: event => dispatch(actions.toggleMouseOnSidebar()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
