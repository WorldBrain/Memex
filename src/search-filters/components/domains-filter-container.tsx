import React, { PureComponent } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { RootState } from 'src/options/types'
import { MapDispatchToProps } from 'src/util/types'
import * as actions from 'src/search-filters/actions'
import * as selectors from 'src/search-filters/selectors'

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
    setDomainFilter: (value: boolean) => void
    addIncDomainFilter: (domain: string) => void
    delIncDomainFilter: (domain: string) => void
    addExcDomainFilter: (domain: string) => void
    delExcDomainFilter: (domain: string) => void
    clearDomainFilters: () => void
    resetFilterPopups: () => void
}

interface OwnProps {
    env: 'inpage' | 'overview'
    tooltipPosition: string
}

type Props = StateProps & DispatchProps & OwnProps

interface State {}

class DomainsPopup extends PureComponent<Props, State> {
    private togglePopup: React.MouseEventHandler<HTMLButtonElement> = e => {
        if (this.props.env === 'inpage' && !this.props.domainFilterDropdown) {
            this.props.resetFilterPopups()
        }

        this.props.domainFilterDropdown
            ? this.props.setDomainFilter(false)
            : this.props.setDomainFilter(true)
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
                env={this.props.env}
                source="Domains"
                filteredItems={this.props.displayDomains}
                togglePopup={this.togglePopup}
                showPopup={this.props.setDomainFilter}
                clearFilters={this.props.clearDomainFilters}
                onFilterDel={this.toggleDomainFilter}
                disableOnClickOutside={this.props.env === 'inpage'}
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
                            isForRibbon={this.props.env === 'inpage'}
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
    setDomainFilter: value => dispatch(actions.setDomainFilter(value)),
    addIncDomainFilter: domain => {
        dispatch(actions.addIncDomainFilter(domain))
        dispatch(actions.fetchSuggestedDomains())
    },
    delIncDomainFilter: domain => dispatch(actions.delIncDomainFilter(domain)),
    addExcDomainFilter: domain => dispatch(actions.addExcDomainFilter(domain)),
    delExcDomainFilter: domain => dispatch(actions.delExcDomainFilter(domain)),
    clearDomainFilters: () => {
        dispatch(actions.setIncDomainFilters([]))
        dispatch(actions.setExcDomainFilters([]))
    },
    resetFilterPopups: () => dispatch(actions.resetFilterPopups()),
})

export default connect(mapStateToProps, mapDispatchToProps)(DomainsPopup)
