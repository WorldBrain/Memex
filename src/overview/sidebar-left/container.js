import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'

import { ListSideBar } from 'src/custom-lists/components'
// import SearchFilters from 'src/search-filters/container'
import { selectors, actions } from './'
import SearchFilters, { actions as filterActs } from '../../search-filters'

// TODO: compress into one
import Sidebar from './components/SideBar'
import ClearFilter from './components/ClearFilter'
import ButtonContainer from './components/ButtonContainer'

class SidebarContainer extends PureComponent {
    static propTypes = {
        filterMode: PropTypes.bool.isRequired,
        hideSearchFilters: PropTypes.func.isRequired,
        showSearchFilters: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        closeSidebar: PropTypes.func.isRequired,
        setSidebarState: PropTypes.func.isRequired,
        clearAllFilters: PropTypes.func.isRequired,
        setMouseOver: PropTypes.func.isRequired,
        resetMouseOver: PropTypes.func.isRequired,
    }

    // Capture state of the react-burger-menu
    captureStateChange = ({ isOpen }) => {
        // reset mouse over when either close button clicked or esc pressed
        if (!isOpen) this.props.resetMouseOver()
        this.props.setSidebarState(isOpen)
    }

    renderSearchFilters = () => <SearchFilters />

    // TODO: Find a better name for list sidebar
    renderListSidebar = () => <ListSideBar />

    renderClearFilters = () => (
        <ClearFilter resetFilters={this.props.clearAllFilters} />
    )

    renderChildren = () => {
        return this.props.filterMode
            ? this.renderSearchFilters()
            : this.renderListSidebar()
    }

    renderSidebarIcons = () =>
        this.props.isSidebarOpen ? (
            <ButtonContainer
                filterBtnClick={this.props.showSearchFilters}
                listBtnClick={this.props.hideSearchFilters}
                showSearchFilters={this.props.filterMode}
                resetFilters={this.props.clearAllFilters}
                closeSidebar={this.closeSidebar}
            />
        ) : null

    closeSidebar = () => {
        this.props.resetMouseOver()
        this.props.closeSidebar()
    }

    render() {
        return (
            <Sidebar
                searchFilters={this.renderSearchFilters()}
                listSidebar={this.renderListSidebar()}
                handleHideSearchFilters={this.props.hideSearchFilters}
                handleShowSearchFilters={this.props.showSearchFilters}
                showSearchFilters={this.props.filterMode}
                isSidebarOpen={this.props.isSidebarOpen}
                sidebarIcons={this.renderSidebarIcons()}
                closeSidebar={this.props.closeSidebar}
                captureStateChange={this.captureStateChange}
                onMouseLeave={this.props.resetMouseOver}
                onMouseEnter={this.props.setMouseOver}
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
            setSidebarState: actions.setSidebarState,
            setMouseOver: actions.setMouseOver,
            resetMouseOver: actions.resetMouseOver,
        },
        dispatch,
    ),
    clearAllFilters: () => dispatch(filterActs.resetFilters()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
