import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
// import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import cx from 'classnames'
// import { bindActionCreators } from 'redux'

import { ListSideBar } from 'src/custom-lists/components'

import localStyles from './Sidebar.css'
import { styles } from './ReactBurgerMenu'

class SidebarContainer extends PureComponent {
    test = () => {}
    render() {
        return (
            <Menu
                styles={styles}
                noOverlay
                customBurgerIcon={<img src="/img/sidebar_icon.svg" />}
                customCrossIcon={<img src="/img/cross.svg" />}
            >
                <div className={localStyles.buttonContainer}>
                    <button
                        className={cx(
                            localStyles.filterButton,
                            localStyles.button,
                        )}
                    />
                    <button
                        className={cx(
                            localStyles.listButton,
                            localStyles.button,
                        )}
                    />
                </div>
                <div>
                    <ListSideBar />
                </div>
            </Menu>
        )
    }
}

export default connect(
    null,
    null,
)(SidebarContainer)
