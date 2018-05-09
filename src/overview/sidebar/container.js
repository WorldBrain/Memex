import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Sidebar from './components/Sidebar'
import * as selectors from './selectors'
import * as actions from './actions'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool.isRequired,
        setShowSidebar: PropTypes.func.isRequired,
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    render() {
        return (
            <div>
                <Sidebar
                    showSidebar={this.props.showSidebar}
                    handleStateChange={this.handleStateChange}
                />
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
})

export default connect(mapStateToProps, mapDispatchToProps)(SidebarContainer)
