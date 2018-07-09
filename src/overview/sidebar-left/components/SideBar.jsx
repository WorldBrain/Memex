import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import cx from 'classnames'

import localStyles from './Sidebar.css'
import { styles } from './ReactBurgerMenu'

class SidebarContainer extends PureComponent {
    static propTypes = {
        resetFilters: PropTypes.node.isRequired,
        children: PropTypes.node.isRequired,
        handleShowSearchFilters: PropTypes.func.isRequired,
        handleHideSearchFilters: PropTypes.func.isRequired,
        showSearchFilters: PropTypes.bool.isRequired,
    }

    render() {
        return (
            <Menu
                styles={styles}
                noOverlay
                customBurgerIcon={<img src="/img/sidebar_icon.svg" />}
                customCrossIcon={<img src="/img/cross_grey.svg" />}
            >
                <div className={localStyles.buttonContainer}>
                    <button
                        className={cx(
                            localStyles.button,
                            localStyles.filterButton,
                            {
                                [localStyles.filterEnabled]: this.props
                                    .showSearchFilters,
                            },
                        )}
                        onClick={this.props.handleShowSearchFilters}
                    />
                    <button
                        className={cx(
                            localStyles.listButton,
                            localStyles.button,
                        )}
                        onClick={this.props.handleHideSearchFilters}
                    />
                </div>
                {this.props.resetFilters}
                {/* <ListSideBar /> */}
                {this.props.children}
            </Menu>
        )
    }
}

export default SidebarContainer
