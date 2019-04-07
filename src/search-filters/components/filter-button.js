import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'
import styles from './filter-button.css'
import moment from 'moment'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

class FilterButton extends PureComponent {
    static propTypes = {
        children: PropTypes.node,
        source: PropTypes.string.isRequired,
        filteredItems: PropTypes.arrayOf(PropTypes.object),
        togglePopup: PropTypes.func.isRequired,
        hidePopup: PropTypes.func.isRequired,
        clearFilters: PropTypes.func.isRequired,
        startDate: PropTypes.number,
        endDate: PropTypes.number,
    }

    state = {
        typesCount: null,
        showDatesClearBtn: false,
    }

    handleClickOutside = () => {
        this.props.hidePopup()
    }

    handleClearFilers = () => {
        this.props.clearFilters()
        this.props.hidePopup()
    }

    renderCount = () => {
        if (this.props.source === 'Types' && this.state.typesCount) {
            return (
                <React.Fragment>
                    <span className={styles.tagCount}>
                        {this.state.typesCount + '/ 2'}
                    </span>
                    <span
                        className={styles.clearFilters}
                        onClick={this.handleClearFilers}
                    />
                </React.Fragment>
            )
        } else if (
            this.props.source === 'Dates' &&
            (this.props.startDate || this.props.endDate)
        ) {
            return (
                <React.Fragment>
                    <span className={styles.detailsFilter}>
                        {moment(this.props.startDate).format('MMM DD, YYYY') +
                            ' - ' +
                            moment(this.props.endDate).format('MMM DD, YYYY')}
                    </span>
                    <span
                        className={styles.clearFilters}
                        onClick={this.handleClearFilers}
                    />
                </React.Fragment>
            )
        } else if (this.props.source === 'Domains' || 'Tags') {
            return (
                <React.Fragment>
                    {this.props.filteredItems.length > 0 && (
                        <React.Fragment>
                            <span className={styles.detailsFilter}>
                                {this.props.filteredItems.length}
                            </span>
                            <ButtonTooltip
                                tooltipText="Clear this Filter"
                                position="bottom"
                            >
                                <span
                                    className={styles.clearFilters}
                                    onClick={this.handleClearFilers}
                                />
                            </ButtonTooltip>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )
        }
    }

    render() {
        return (
            <div>
                <button
                    className={
                        this.props.filteredItems.length ||
                        this.props.startDate ||
                        this.props.endDate
                            ? styles.tagButtonSelected
                            : styles.tagButton
                    }
                    onClick={this.props.togglePopup}
                >
                    {this.props.source}
                    {this.renderCount()}
                </button>
                {this.props.children}
            </div>
        )
    }
}

export default OnClickOutside(FilterButton)
