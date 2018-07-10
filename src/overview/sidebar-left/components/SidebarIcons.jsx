import React from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './SidebarIcons.css'

const SidebarIcons = props => {
    return (
        <div
            className={cx(styles.buttonContainerOverview, {
                [styles.buttonContainer]: !props.overviewMode,
            })}
        >
            <button
                className={cx(styles.button, styles.filterButton, {
                    [styles.filterEnabled]: props.showSearchFilters,
                })}
                onClick={props.filterBtnClick}
            />
            <button
                className={cx(styles.listButton, styles.button)}
                onClick={props.listBtnClick}
            />
        </div>
    )
}

SidebarIcons.propTypes = {
    filterBtnClick: PropTypes.func.isRequired,
    listBtnClick: PropTypes.func.isRequired,
    overviewMode: PropTypes.bool,
    showSearchFilters: PropTypes.bool,
}

export default SidebarIcons
