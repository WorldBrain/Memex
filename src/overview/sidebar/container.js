import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import onClickOutside from 'react-onclickoutside'
import Sidebar, { CloseButton } from 'src/sidebar-overlay/'
import * as selectors from './selectors'
import * as actions from './actions'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool.isRequired,
        setShowSidebar: PropTypes.func.isRequired,
        toggleMouseOnSidebar: PropTypes.func.isRequired,
        pageUrl: PropTypes.string.isRequired,
        pageTitle: PropTypes.string.isRequired,
        closeSidebar: PropTypes.func.isRequired,
    }

    handleClickOutside = () => this.props.closeSidebar()

    render() {
        return (
            <div>
                {this.props.showSidebar ? (
                    <Sidebar {...this.props} env={'overview'} />
                ) : null}
                <CloseButton
                    isActive={this.props.showSidebar}
                    isOverview
                    clickHandler={e => {
                        e.preventDefault()
                        this.props.setShowSidebar(false)
                    }}
                />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    showSidebar: selectors.showSidebar(state),
    pageUrl: selectors.pageUrl(state),
    pageTitle: selectors.pageTitle(state),
})

const mapDispatchToProps = dispatch => ({
    setShowSidebar: showSidebar =>
        dispatch(actions.setShowSidebar(showSidebar)),
    toggleMouseOnSidebar: () => dispatch(actions.toggleMouseOnSidebar()),
    closeSidebar: () => dispatch(actions.closeSidebar()),
})

const enhancedSidebar = onClickOutside(SidebarContainer)

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(enhancedSidebar)
