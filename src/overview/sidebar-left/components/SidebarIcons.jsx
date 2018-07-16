import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'

import styles from './SidebarIcons.css'
import InfoTooltip from './Tooltip'

class SidebarIcons extends PureComponent {
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
                <button
                    className={cx(styles.button, styles.filterButton, {
                        [styles.filterEnabled]: this.props.showSearchFilters,
                    })}
                    onClick={this.props.filterBtnClick}
                />
                <InfoTooltip
                    showTooltip={this.state.showCollTooltip}
                    content="My collections"
                />
                <button
                    className={cx(styles.listButton, styles.button)}
                    onClick={this.props.listBtnClick}
                    onDragEnter={this.props.onPageDrag}
                    onMouseOver={this.handleShowCollTooltip}
                    onMouseOut={this.handleHideCollTooltip}
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
    onPageDrag: PropTypes.func,
}

export default SidebarIcons
