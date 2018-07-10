import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { slide as Menu } from 'react-burger-menu'
import cx from 'classnames'

import localStyles from './Sidebar.css'

const SidebarIcons = props => (
    <div className={localStyles.buttonContainer}>
        <button
            className={cx(localStyles.button, localStyles.filterButton, {
                [localStyles.filterEnabled]: props.showSearchFilters,
            })}
            onClick={props.handleShowSearchFilters}
        />
        <button
            className={cx(localStyles.listButton, localStyles.button)}
            onClick={props.handleHideSearchFilters}
        />
    </div>
)

export default SidebarIcons
