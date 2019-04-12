import React, { PureComponent } from 'react'
import OnClickOutside from 'react-onclickoutside'
import moment from 'moment'
import { ButtonTooltip } from 'src/common-ui/components/'

const styles = require('./filter-button.css')

interface Props {
    chidren?: React.ReactNode
    source: string
    filteredItems: object[]
    displayFilters?: React.ReactNode
    startDate?: number
    endDate?: number
    togglePopup: () => void
    hidePopup: () => void
    clearFilters: () => void
    onFilterDel?: (args: any) => void
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

    handleClickOutside = (e: Event) => {
        e.stopPropagation()
        this.props.hidePopup()
    }

    handleClearFilers = e => {
        e.stopPropagation()
        this.props.clearFilters()
        this.props.hidePopup()
    }

    private renderCount() {
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
