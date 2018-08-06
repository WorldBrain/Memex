import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './ButtonContainer.css'

class ButtonContainer extends PureComponent {
    static propTypes = {
        filterBtnClick: PropTypes.func.isRequired,
        listBtnClick: PropTypes.func.isRequired,
        overviewMode: PropTypes.bool,
        showSearchFilters: PropTypes.bool,
        showClearFiltersBtn: PropTypes.bool.isRequired,
        resetFilters: PropTypes.func.isRequired,
        closeSidebar: PropTypes.func.isRequired,
    }

    render() {
        return (
            <div
                className={cx(styles.buttonContainerOverview, {
                    [styles.buttonContainer]: !this.props.overviewMode,
                })}
            >
                <div
                    className={cx(styles.wrapper, {
                        [styles.wrapperFE]: !this.props.showClearFiltersBtn,
                    })}
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
                    {this.props.showClearFiltersBtn && (
                        <span
                            className={styles.clearFilters}
                            onClick={this.props.resetFilters}
                        >
                            clear filters
                        </span>
                    )}
                </div>
                <button
                    className={cx(styles.closeIcon, styles.button)}
                    onClick={this.props.closeSidebar}
                />
            </div>
        )
    }
}

export default ButtonContainer
