import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Sidebar from 'src/sidebar-overlay/'
import * as selectors from './selectors'
import * as actions from './actions'

const SidebarContainer = props => (
    <div>
        {props.showSidebar ? <Sidebar {...props} env={'overview'} /> : null}
    </div>
)

SidebarContainer.propTypes = {
    showSidebar: PropTypes.bool.isRequired,
    setShowSidebar: PropTypes.func.isRequired,
    toggleMouseOnSidebar: PropTypes.func.isRequired,
    pageUrl: PropTypes.string.isRequired,
}

const mapStateToProps = state => ({
    showSidebar: selectors.showSidebar(state),
    pageUrl: selectors.pageUrl(state),
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
