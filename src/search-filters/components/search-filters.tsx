import React, { PureComponent } from 'react'
import cx from 'classnames'
import { TooltipBox } from '@worldbrain/memex-common/ts/common-ui/components/tooltip-box'

interface Props {
    tagFilter: React.ReactNode
    hashtagsFilter: React.ReactNode
    dateFilter: React.ReactNode
    domainFilter: React.ReactNode
    userFilter: React.ReactNode
    contentFilter: React.ReactNode
    bookmarkFilter: React.ReactNode
    toggleFilterBar: () => void
    getRootElement: () => HTMLElement
}

interface State {}

class SearchFilters extends PureComponent<Props, State> {
    render() {
        return (
            <div className="filterBar">
                <div className="innerContainer">
                    <div className="filters">
                        {this.props.bookmarkFilter}
                        {this.props.dateFilter}
                        {this.props.tagFilter}
                        {this.props.domainFilter}
                        {this.props.hashtagsFilter}
                        {this.props.contentFilter}
                    </div>
                    <TooltipBox
                        tooltipText="Close Filter Bar"
                        placement="bottom"
                        getPortalRoot={this.props.getRootElement}
                    >
                        <div
                            className={cx('button', 'arrow')}
                            onClick={() => this.props.toggleFilterBar()}
                        />
                    </TooltipBox>
                </div>
            </div>
        )
    }
}

export default SearchFilters
