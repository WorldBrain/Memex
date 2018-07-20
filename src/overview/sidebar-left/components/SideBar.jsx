import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'

import { styles } from './ReactBurgerMenu'
import localStyles from './Sidebar.css'

class Sidebar extends PureComponent {
    static propTypes = {
        children: PropTypes.node.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
        sidebarIcons: PropTypes.node,
        captureStateChange: PropTypes.func.isRequired,
        onMouseLeave: PropTypes.func.isRequired,
        onMouseEnter: PropTypes.func.isRequired,
        // closeSidebar: PropTypes.func.isRequired
    }

    render() {
        return (
            <Menu
                styles={styles}
                noOverlay
                customBurgerIcon={null}
                customCrossIcon={<img src="/img/cross_grey.svg" />}
                isOpen={this.props.isSidebarOpen}
                onStateChange={this.props.captureStateChange}
            >
                <div
                    onMouseLeave={this.props.onMouseLeave}
                    onMouseEnter={this.props.onMouseEnter}
                    className={localStyles.container}
                >
                    {this.props.sidebarIcons}
                    {this.props.children}
                </div>
            </Menu>
        )
    }
}

export default Sidebar
