import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'

import { ListSideBar } from 'src/custom-lists/components'
import SearchFilters from 'src/search-filters/container'
import { selectors, actions } from './'

// TODO: compress into one
import Sidebar from './components/SideBar'
import ClearFilter from './components/ClearFilter'
import SidebarIcons from './components/SidebarIcons'

class SidebarContainer extends PureComponent {
    static propTypes = {
        filterMode: PropTypes.bool.isRequired,
        hideSearchFilters: PropTypes.func.isRequired,
        showSearchFilters: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
    }

    renderSearchFilters = () => <SearchFilters />

    // TODO: Find a better name for list sidebar
    renderListSidebar = () => <ListSideBar />

    renderClearFilters = () => <ClearFilter />

    renderChildren = () => {
        return this.props.filterMode
            ? this.renderSearchFilters()
            : this.renderListSidebar()
    }

    renderSidebarIcons = () => (
        <SidebarIcons
            filterBtnClick={this.props.showSearchFilters}
            listBtnClick={this.props.hideSearchFilters}
            showSearchFilters={this.props.filterMode}
        />
    )

    render() {
        return (
            <Sidebar
                searchFilters={this.renderSearchFilters()}
                listSidebar={this.renderListSidebar()}
                resetFilters={this.renderClearFilters()}
                handleHideSearchFilters={this.props.hideSearchFilters}
                handleShowSearchFilters={this.props.showSearchFilters}
                showSearchFilters={this.props.filterMode}
                isSidebarOpen={this.props.isSidebarOpen}
                sidebarIcons={this.renderSidebarIcons()}
            >
                {this.renderChildren()}
            </Sidebar>
        )
    }
}

const mapStateToProps = state => ({
    isSidebarOpen: selectors.isSidebarOpen(state),
    filterMode: selectors.showFilters(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            showSearchFilters: actions.openSidebarFilterMode,
            hideSearchFilters: actions.openSidebarListMode,
            closeSidebar: actions.closeSidebar,
        },
        dispatch,
    ),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
