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
    constructor(props) {
        super(props)
        this.state = {
            showSearchFilters: false,
        }
    }

    handleShowSearchFilters = () => {
        this.setState({
            showSearchFilters: true,
        })
    }

    handleHideSearchFilters = () => {
        this.setState({
            showSearchFilters: false,
        })
    }

    renderSearchFilters = () => <SearchFilters />

    // TODO: Find a better name for list sidebar
    renderListSidebar = () => <ListSideBar />

    renderClearFilters = () => <ClearFilter />

    renderBody = () => {
        return this.state.showSearchFilters
            ? this.renderSearchFilters()
            : this.renderListSidebar()
    }

    render() {
        return (
            <Sidebar
                searchFilters={this.renderSearchFilters()}
                listSidebar={this.renderListSidebar()}
                resetFilters={this.renderClearFilters()}
                handleHideSearchFilters={this.handleHideSearchFilters}
                handleShowSearchFilters={this.handleShowSearchFilters}
                showSearchFilters={this.state.showSearchFilters}
            >
                {this.renderBody()}
            </Sidebar>
        )
    }
}

export default connect(
    null,
    null,
)(SidebarContainer)
