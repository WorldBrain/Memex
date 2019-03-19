import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './SidebarIcons.css'
import ButtonTooltip from '../../../common-ui/components/button-tooltip'

class SidebarIcons extends PureComponent {
    static propTypes = {
        filterBtnClick: PropTypes.func.isRequired,
        listBtnClick: PropTypes.func.isRequired,
        overviewMode: PropTypes.bool,
        onPageDrag: PropTypes.func,
        onClearBtnClick: PropTypes.func,
        onShowBtnClick: PropTypes.func,
        filterActive: PropTypes.bool.isRequired,
        isListFilterActive: PropTypes.bool.isRequired,
    }

    render() {
        return (
            <div
                className={cx(styles.buttonContainerOverview, {
                    [styles.buttonContainer]: !this.props.overviewMode,
                })}
            >
                <ButtonTooltip 
                    position="right"
                    tooltipText="Filters"
                >
                <div className={styles.enabled}>
                    <button
                        className={cx(styles.button, styles.filterButton, {
                            [styles.filterEnabled]: this.props.filterActive,
                        })}
                        onClick={this.props.filterBtnClick}
                        id="filter-icon"
                        onMouseOver={this.handleShowFilterTooltip}
                        onMouseOut={this.handleHideFilterTooltip}
                    />
                    {this.props.filterActive && (
                        <div
                            onClick={this.props.onClearBtnClick}
                            className={styles.smallButton}
                        >
                            clear
                        </div>
                    )}
                </div>
                </ButtonTooltip>
                <ButtonTooltip
                    position="right"
                    tooltipText="My Collections"
                >
                <div className={styles.enabled}>
                    <button
                        className={cx(styles.listButton, styles.button, {
                            [styles.collectionEnabled]: this.props
                                .isListFilterActive,
                        })}
                        onClick={this.props.listBtnClick}
                        onDragEnter={this.props.onPageDrag}
                        onMouseOver={this.handleShowCollTooltip}
                        onMouseOut={this.handleHideCollTooltip}
                        id="collection-icon"
                    />
                    {this.props.isListFilterActive && (
                        <div
                            onClick={this.props.onShowBtnClick}
                            className={styles.smallButton}
                        >
                            show all
                        </div>
                    )}
                </div>
                </ButtonTooltip>
            </div>
        )
    }
}

export default SidebarIcons
