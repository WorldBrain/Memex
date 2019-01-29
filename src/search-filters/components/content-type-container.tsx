import React, { PureComponent, Fragment } from 'react'

import FilterBar from './FilterBar'
import ContentTypes from './content-types'

export interface Props {
    showFilteredTypes: boolean
    toggleFilterTypes: () => void
}

export interface State {}

class ContentTypeContainer extends PureComponent<Props, State> {
    render() {
        return (
            <Fragment>
                <FilterBar
                    filter="Content Type"
                    onBarClick={this.props.toggleFilterTypes}
                />
                {this.props.showFilteredTypes && <ContentTypes />}
            </Fragment>
        )
    }
}

export default ContentTypeContainer
