import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import onClickOutside from 'react-onclickoutside'

import { selectors, actions } from '..'
import { actions as filterActs } from 'src/search-filters'
import { selectors as customLists } from '../../../custom-lists'
import { ListSideBar } from '../../../custom-lists/components'

import Sidebar from './SideBar'
import crowdfundingModalStyles from 'src/common-ui/crowdfunding/components/CFModal.css'
import collectionsButtonStyles from './collections-button.css'
import localStyles from './Sidebar.css'

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

    constructor(props) {
        super(props)
        this.dragging = false
    }

    resize = event => {
        // TO-DO: Find a better way to get ref from child component
        const element = document.querySelector('#resizable')
        const MINIMUM_SIZE = 249
        const originalWidth = 0
        const elementWidth = originalWidth + event.pageX
        this.dragging = true

        event.target.style.cursor = 'ew-resizable'

        if (elementWidth > MINIMUM_SIZE) {
            element.style.width = `${elementWidth}px`
        }
    }

    stopResize = () => {
        this.dragging = false
        window.removeEventListener('mousemove', this.resize)
    }

    setSidebarResizable = e => {
        e.preventDefault()
        window.addEventListener('mousemove', this.resize)
        window.addEventListener('mouseup', this.stopResize)
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
        if ($hoverOvercollections || this.dragging) {
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
                <div
                    className={localStyles.resizer}
                    onMouseDown={this.setSidebarResizable}
                />
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
