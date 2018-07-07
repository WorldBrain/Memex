import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
// import PropTypes from 'prop-types'
// import { bindActionCreators } from 'redux'

import { ListSideBar } from 'src/custom-lists/components'
import SearchFilters from 'src/search-filters/container'

// TODO: compress into one
import Sidebar from './components/SideBar'
import ClearFilter from './components/ClearFilter'

class SidebarContainer extends PureComponent {
    renderSearchFilters = () => <SearchFilters />

    // TODO: Find a better name for list sidebar
    renderListSidebar = () => <ListSideBar />

    renderClearFilters = () => <ClearFilter />

    render() {
        return (
            <Sidebar
                searchFilters={this.renderSearchFilters()}
                listSidebar={this.renderListSidebar()}
                resetFilters={this.renderClearFilters()}
                content={this.renderSearchFilters()}
            >
                {this.renderSearchFilters()}
            </Sidebar>
        )
    }
}

export default connect(
    null,
    null,
)(SidebarContainer)
