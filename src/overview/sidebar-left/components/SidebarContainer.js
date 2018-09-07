import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import onClickOutside from 'react-onclickoutside'

import { selectors, actions } from '..'
import SearchFilters, {
    actions as filterActs,
    selectors as filters,
} from '../../../search-filters'
import { selectors as customLists } from '../../../custom-lists'
import { ListSideBar } from '../../../custom-lists/components'

import Sidebar from './SideBar'
import ClearFilter from './ClearFilter'
import ButtonContainer from './ButtonContainer'

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
        showClearFiltersBtn: PropTypes.bool.isRequired,
        urlDragged: PropTypes.string.isRequired,
    }

    // Capture state of the react-burger-menu
    captureStateChange = ({ isOpen }) => {
        // reset mouse over when either close button clicked or esc pressed
        if (!isOpen) this.props.resetMouseOver()
        this.props.setSidebarState(isOpen)
    }

    handleClickOutside = e => {
        const { id } = e.target
        // Delay the closing of the sidebar for 200ms to check is something is
        // being dragged.
        setTimeout(() => {
            if (id !== 'filter-icon' && id !== 'collection-icon') {
                if (!this.props.urlDragged) this.props.closeSidebar()
            }
        }, 200)
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
                showClearFiltersBtn={this.props.showClearFiltersBtn}
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
    showClearFiltersBtn: filters.showClearFiltersBtn(state),
    urlDragged: customLists.urlDragged(state),
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
)(onClickOutside(SidebarContainer))
