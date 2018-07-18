import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './SidebarIcons.css'
import InfoTooltip from './Tooltip'

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

    constructor(props) {
        super(props)
        this.state = {
            // Capture mouse over events and display tooltip
            showCollTooltip: false,
        }
    }

    handleShowCollTooltip = () => {
        this.setState({
            showCollTooltip: true,
        })
    }

    handleHideCollTooltip = () => {
        this.setState({
            showCollTooltip: false,
        })
    }

    render() {
        return (
            <div
                className={cx(styles.buttonContainerOverview, {
                    [styles.buttonContainer]: !this.props.overviewMode,
                })}
            >
                <div className={styles.enabled}>
                    <button
                        className={cx(styles.button, styles.filterButton, {
                            [styles.filterEnabled]: this.props.filterActive,
                        })}
                        onClick={this.props.filterBtnClick}
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
                <InfoTooltip
                    showTooltip={this.state.showCollTooltip}
                    content="My collections"
                />
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
            </div>
        )
    }
}

export default SidebarIcons
