import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'
import { formatTimestamp } from '@worldbrain/memex-common/ts/utils/date-time'

interface Props {
    env: 'overview' | 'inpage'
    chidren?: React.ReactNode
    source: string
    filteredItems: object[]
    displayFilters?: React.ReactNode
    startDate?: number
    endDate?: number
    togglePopup: React.MouseEventHandler<HTMLDivElement>
    showPopup: (value: boolean) => void
    clearFilters: () => void
    onFilterDel?: (args: any) => void
    getRootElement: () => HTMLElement
}

interface State {
    typesCount: number
    showDatesClearBtn: boolean
}

class FilterButton extends PureComponent<Props, State> {
    state: State = {
        typesCount: null,
        showDatesClearBtn: false,
    }

    get styles() {
        if (this.props.env === 'overview') {
            // dashboardStyles would be inlined as strings
        }
        // sidebarStyles similarly
    }

    private handleClickOutside = (e: Event) => {
        e.stopPropagation()
        this.props.showPopup(false)
    }

    private handleClearFilters: React.MouseEventHandler<HTMLSpanElement> = (
        e,
    ) => {
        e.stopPropagation()
        this.props.clearFilters()
        this.props.showPopup(false)
    }

    private renderCount() {
        if (this.props.source === 'Types' && this.state.typesCount) {
            return (
                <React.Fragment>
                    <span className="renderCount">
                        {this.state.typesCount + '/ 2'}
                    </span>
                </React.Fragment>
            )
        } else if (
            this.props.source === 'Dates' &&
            (this.props.startDate || this.props.endDate)
        ) {
            return (
                <React.Fragment>
                    <div className="dateBox">
                        <span className="detailsFilter">
                            {formatTimestamp(
                                this.props.startDate,
                                'MMM DD, YYYY',
                            ) +
                                ' - ' +
                                formatTimestamp(
                                    this.props.endDate,
                                    'MMM DD, YYYY',
                                )}
                        </span>
                    </div>
                </React.Fragment>
            )
        } else if (this.props.source === 'Domains' || 'Tags') {
            return (
                <React.Fragment>
                    {this.props.filteredItems.length > 0 && (
                        <React.Fragment>
                            <span className="renderCount">
                                {this.props.filteredItems.length}
                            </span>
                        </React.Fragment>
                    )}
                </React.Fragment>
            )
        }
    }

    render() {
        return (
            <div>
                <div
                    className={classNames('tagButton', {
                        ['tagButtonSelected']: this.props.filteredItems.length,
                        ['tagButtonDate']:
                            this.props.startDate || this.props.endDate,
                    })}
                    onClick={this.props.togglePopup}
                >
                    {this.props.source === 'Dates' ? (
                        <React.Fragment>
                            <div className="dateTopBox">
                                {(this.props.startDate ||
                                    this.props.endDate) && (
                                    <TooltipBox
                                        tooltipText="Clear this Filter"
                                        placement="bottom"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <span
                                            className="clearFilters"
                                            onClick={this.handleClearFilters}
                                        />
                                    </TooltipBox>
                                )}
                                <span className="pillTitle">
                                    {this.props.source}
                                </span>
                            </div>
                            {this.renderCount()}
                        </React.Fragment>
                    ) : (
                        <div className="pillContent">
                            {this.props.filteredItems.length > 0 ? (
                                <div className="filterItem">
                                    <TooltipBox
                                        tooltipText="Clear this Filter"
                                        placement="bottom"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <span
                                            className="clearFilters"
                                            onClick={this.handleClearFilters}
                                        />
                                    </TooltipBox>
                                    <div className="dateTopBox">
                                        <span className="pillTitle">
                                            {this.props.source}
                                        </span>
                                        {this.renderCount()}
                                    </div>
                                </div>
                            ) : (
                                <div>{this.props.source}</div>
                            )}
                        </div>
                    )}
                </div>
                {this.props.children}
            </div>
        )
    }
}

export default FilterButton
