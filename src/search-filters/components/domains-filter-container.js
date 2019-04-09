import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { actions, selectors } from '../'

import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import FilterButton from './filter-button'
import cx from 'classnames'

import PropTypes from 'prop-types'

import styles from './domains-filter.css'

class DomainsPopup extends PureComponent {
    static propTypes = {
        env: PropTypes.oneOf(['overview', 'inpage']).isRequired,
        displayDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
        suggestedDomains: PropTypes.arrayOf(PropTypes.object).isRequired,
        domainsInc: PropTypes.arrayOf(PropTypes.string).isRequired,
        domainsExc: PropTypes.arrayOf(PropTypes.string).isRequired,
        domainFilterDropdown: PropTypes.bool.isRequired,
        tooltipPosition: PropTypes.string.isRequired,
        showDomainFilter: PropTypes.func.isRequired,
        hideDomainFilter: PropTypes.func.isRequired,
        addIncDomainFilter: PropTypes.func.isRequired,
        delIncDomainFilter: PropTypes.func.isRequired,
        addExcDomainFilter: PropTypes.func.isRequired,
        delExcDomainFilter: PropTypes.func.isRequired,
        clearDomainFilters: PropTypes.func.isRequired,
    }

    togglePopup = () => {
        this.props.domainFilterDropdown
            ? this.props.hideDomainFilter()
            : this.props.showDomainFilter()
    }

    renderFilteredDomains = () => {
        return (
            !this.props.domainFilterDropdown &&
            this.props.displayDomains.map(({ value, isExclusive }, i) => (
                <div className={styles.domainPill} style={{ display: 'flex' }}>
                    <span>{value}</span>
                    <button
                        className={styles.cross}
                        onClick={this.toggleDomainFilter({
                            value,
                            isExclusive,
                        })}
                    />
                </div>
            ))
        )
    }

    toggleDomainFilter = ({ value, isExclusive }) => () => {
        !isExclusive
            ? this.props.delIncDomainFilter(value)
            : this.props.delExcDomainFilter(value)
    }

    render() {
        return (
            <FilterButton
                source="Domains"
                filteredItems={this.props.displayDomains}
                togglePopup={this.togglePopup}
                hidePopup={this.props.hideDomainFilter}
                clearFilters={this.props.clearDomainFilters}
                onFilterDel={this.toggleDomainFilter}
            >
                {this.props.domainFilterDropdown && (
                    <Tooltip
                        position={this.props.tooltipPosition}
                        itemClass={cx({
                            [styles.domainTooltip]:
                                this.props.env === 'overview',
                        })}
                    >
                        <IndexDropdown
                            env={this.props.env}
                            onFilterAdd={this.props.addIncDomainFilter}
                            onFilterDel={this.props.delIncDomainFilter}
                            onExcFilterAdd={this.props.addExcDomainFilter}
                            onExcFilterDel={this.props.delExcDomainFilter}
                            initFilters={this.props.domainsInc}
                            initExcFilters={this.props.domainsExc}
                            initSuggestions={this.props.suggestedDomains.map(
                                ({ value }) => value,
                            )}
                            source="domain"
                            isForSidebar
                            isForFilters
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps = state => ({
    displayDomains: selectors.displayDomains(state),
    suggestedDomains: selectors.suggestedDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    domainsInc: selectors.domainsInc(state),
    domainsExc: selectors.domainsExc(state),
})

const mapDispatchToProps = dispatch => ({
    showDomainFilter: () => dispatch(actions.showDomainFilter()),
    hideDomainFilter: () => dispatch(actions.hideDomainFilter()),
    addIncDomainFilter: domain => dispatch(actions.addIncDomainFilter(domain)),
    delIncDomainFilter: domain => dispatch(actions.delIncDomainFilter(domain)),
    addExcDomainFilter: domain => dispatch(actions.addExcDomainFilter(domain)),
    delExcDomainFilter: domain => dispatch(actions.delExcDomainFilter(domain)),
    clearDomainFilters: () => {
        dispatch(actions.setIncDomainFilters([]))
        dispatch(actions.setExcDomainFilters([]))
    },
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DomainsPopup)
