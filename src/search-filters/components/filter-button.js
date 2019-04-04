import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import OnClickOutside from 'react-onclickoutside'
import cx from 'classnames'
import styles from './filter-button.css'
import moment from 'moment'

class FilterButton extends PureComponent {
    static propTypes = {
        children: PropTypes.node,
        source: PropTypes.string.isRequired,
        filteredItems: PropTypes.arrayOf(PropTypes.object),
        togglePopup: PropTypes.func.isRequired,
        hidePopup: PropTypes.func.isRequired,
        clearFilters: PropTypes.func.isRequired,
        onFilterDel: PropTypes.func,
        displayFilters: PropTypes.func,
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

    renderSelectedFilters = () => {
        if (this.props.source === 'Types') {
            const filters = this.props.displayFilters()
            this.setState({ typesCount: filters.length })
            return filters
        } else if (
            this.props.source === 'Dates' &&
            (this.props.startDate || this.props.endDate)
        ) {
            return (
                <span className={styles.dateText}>
                    {moment(this.props.startDate).format('MMM DD, YYYY') +
                        ' - ' +
                        moment(this.props.endDate).format('MMM DD, YYYY')}
                </span>
            )
        } else if (this.props.source === 'Tags' || 'Domains') {
            return (
                <React.Fragment>
                    {this.props.filteredItems.map(
                        ({ value, isExclusive }, i) => (
                            <span
                                key={i}
                                className={cx({
                                    [styles.spanInc]: !isExclusive,
                                    [styles.spanExc]: isExclusive,
                                })}
                            >
                                {value}
                                <span
                                    className={styles.clearFilters}
                                    onClick={this.props.onFilterDel({
                                        value,
                                        isExclusive,
                                    })}
                                />
                            </span>
                        ),
                    )}
                </React.Fragment>
            )
        }
    }

    renderCount = () => {
        if (this.props.source === 'Types' && this.state.typesCount) {
            return (
                <React.Fragment>
                    <span className={styles.tagCount}>
                        {this.state.typesCount + '/ 4'}
                    </span>
                    <span
                        className={styles.clearFilters}
                        onClick={this.props.clearFilters}
                    />
                </React.Fragment>
            )
        } else if (
            this.props.source === 'Dates' &&
            (this.props.startDate || this.props.endDate)
        ) {
            return (
                <span
                    className={styles.clearFilters}
                    onClick={this.props.clearFilters}
                />
            )
        } else if (this.props.source === 'Domains' || 'Tags') {
            return (
                <React.Fragment>
                    {this.props.filteredItems.length > 0 && (
                        <React.Fragment>
                            <span className={styles.tagCount}>
                                {this.props.filteredItems.length}
                            </span>
                            <span
                                className={styles.clearFilters}
                                onClick={this.props.clearFilters}
                            />
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
                        this.props.filteredItems.length
                            ? styles.tagButtonSelected
                            : styles.tagButton
                    }
                    onClick={this.props.togglePopup}
                >
                    {this.props.source}
                    {this.renderCount()}
                </button>
                <div className={styles.displayFilters}>
                    {this.renderSelectedFilters()}
                </div>
                {this.props.children}
            </div>
        )
    }
}

export default OnClickOutside(FilterButton)
