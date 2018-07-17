import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ButtonContainer.css'

class SidebarIcons extends PureComponent {
    render() {
        return (
            <div
                className={cx(styles.buttonContainerOverview, {
                    [styles.buttonContainer]: !this.props.overviewMode,
                })}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-evenly',
                        width: '72%',
                        alignItems: 'center',
                    }}
                >
                    <button
                        className={cx(styles.button, styles.filterButton, {
                            [styles.filterEnabled]: this.props
                                .showSearchFilters,
                        })}
                        onClick={this.props.filterBtnClick}
                    />
                    <button
                        className={cx(styles.listButton, styles.button, {
                            [styles.filterEnabled]: !this.props
                                .showSearchFilters,
                        })}
                        onClick={this.props.listBtnClick}
                    />
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.resetFilters}
                    >
                        clear filters
                    </span>
                </div>
                <button
                    className={cx(styles.closeIcon, styles.button)}
                    onClick={this.props.closeSidebar}
                />
            </div>
        )
    }
}

SidebarIcons.propTypes = {
    filterBtnClick: PropTypes.func.isRequired,
    listBtnClick: PropTypes.func.isRequired,
    overviewMode: PropTypes.bool,
    showSearchFilters: PropTypes.bool,
    resetFilters: PropTypes.func.isRequired,
    closeSidebar: PropTypes.func.isRequired,
}

export default SidebarIcons
