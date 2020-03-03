import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import onClickOutside from 'react-onclickoutside'

import { selectors, actions } from '..'
import * as filterActs from 'src/search-filters/actions'
import { selectors as customLists } from '../../../custom-lists'
import { ListSideBar } from '../../../custom-lists/components'

import Sidebar from './SideBar'
import crowdfundingModalStyles from 'src/common-ui/crowdfunding/components/CFModal.css'
import collectionsButtonStyles from './collections-button.css'

class SidebarContainer extends PureComponent {
    static propTypes = {
        isSidebarOpen: PropTypes.bool.isRequired,
        isSidebarLocked: PropTypes.bool.isRequired,
        openSidebar: PropTypes.func.isRequired,
        closeSidebar: PropTypes.func.isRequired,
        setSidebarState: PropTypes.func.isRequired,
        setSidebarLocked: PropTypes.func.isRequired,
        setMouseOver: PropTypes.func.isRequired,
        resetMouseOver: PropTypes.func.isRequired,
        urlDragged: PropTypes.string.isRequired,
    }

    // Capture state of the react-burger-menu
    captureStateChange = ({ isOpen }) => {
        // reset mouse over when either close button clicked or esc pressed
        if (!isOpen) {
            this.props.resetMouseOver()
        }
        this.props.setSidebarState(isOpen)
    }

    handleClickOutside = e => {
        const { id } = e.target

        // Don't attempt close of sidebar if click occurred within crowdfunding modal (see `sidebar-overlay` feature)
        const $modalContainer = document.querySelector(
            `.${crowdfundingModalStyles.background}`,
        )
        const $collectionsContainer = document.querySelector(
            `.${collectionsButtonStyles.buttonContainer}`,
        )

        if (
            ($modalContainer && $modalContainer.contains(e.target)) ||
            ($collectionsContainer && $collectionsContainer.contains(e.target))
        ) {
            return
        }

        // Delay the closing of the sidebar for 200ms to check is something is
        // being dragged.
        setTimeout(() => {
            if (id !== 'filter-icon' && id !== 'collection-icon') {
                if (!this.props.urlDragged) {
                    this.props.closeSidebar()
                }
            }
        }, 200)
    }

    // TODO: Find a better name for list sidebar
    renderListSidebar = () => <ListSideBar />

    closeSidebar = () => {
        this.props.resetMouseOver()
        this.props.closeSidebar()
    }

    onMouseLeave = e => {
        const $hoverOvercollections = document.querySelector(
            `.${collectionsButtonStyles.buttonContainer}:hover`,
        )
        if ($hoverOvercollections) {
            return
        }

        this.props.resetMouseOver()
        this.props.closeSidebar()
    }

    openSidebaronMouseEnter = () => {
        this.props.setMouseOver()
        this.props.openSidebar()
    }

    render() {
        return (
            <Sidebar
                isSidebarOpen={this.props.isSidebarOpen}
                isSidebarLocked={this.props.isSidebarLocked}
                captureStateChange={this.captureStateChange}
                onMouseLeave={this.onMouseLeave}
                onMouseEnter={this.props.setMouseOver}
                closeSidebar={this.props.closeSidebar}
                setSidebarLocked={this.props.setSidebarLocked}
                openSidebaronMouseEnter={this.openSidebaronMouseEnter}
            >
                {this.renderListSidebar()}
            </Sidebar>
        )
    }
}

const mapStateToProps = state => ({
    isSidebarOpen: selectors.isSidebarOpen(state),
    isSidebarLocked: selectors.sidebarLocked(state),
    urlDragged: customLists.urlDragged(state),
})

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            closeSidebar: actions.closeSidebar,
            openSidebar: actions.openSidebar,
            setSidebarState: actions.setSidebarState,
            setMouseOver: actions.setMouseOver,
            resetMouseOver: actions.resetMouseOver,
            setSidebarLocked: actions.setSidebarLocked,
        },
        dispatch,
    ),
    clearAllFilters: () => dispatch(filterActs.resetFilters()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(onClickOutside(SidebarContainer))
