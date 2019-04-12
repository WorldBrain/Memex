import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { MapDispatchToProps } from 'src/util/types'
import { actions, selectors } from 'src/search-filters'

import { Tooltip } from 'src/common-ui/components'
import { IndexDropdown } from 'src/common-ui/containers'
import FilterButton from './filter-button'

import cx from 'classnames'

const styles = require('./domains-filter.css')

interface StateProps {
    domainFilterDropdown: boolean
    domainsInc: string[]
    domainsExc: string[]
    displayDomains: any
    suggestedDomains: any
}

interface DispatchProps {
    showDomainFilter: () => void
    hideDomainFilter: () => void
    addIncDomainFilter: (domain: string) => void
    delIncDomainFilter: (domain: string) => void
    addExcDomainFilter: (domain: string) => void
    delExcDomainFilter: (domain: string) => void
    clearDomainFilters: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class DomainsPopup extends PureComponent<Props, State> {
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
                        />
                    </Tooltip>
                )}
            </FilterButton>
        )
    }
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, RootState> = (
    state,
): StateProps => ({
    displayDomains: selectors.displayDomains(state),
    suggestedDomains: selectors.suggestedDomains(state),
    domainFilterDropdown: selectors.domainFilter(state),
    domainsInc: selectors.domainsInc(state),
    domainsExc: selectors.domainsExc(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = dispatch => ({
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
