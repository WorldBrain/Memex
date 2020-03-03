import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import State from '../types'
import { MapDispatchToProps } from '../../types'
import IndexDropdown from 'src/common-ui/containers/IndexDropdown'

interface StateProps {
    tags: string[]
    initTagSuggestions: string[]
}

interface DispatchProps {
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
}

interface OwnProps {
    env?: 'inpage' | 'overview'
    /* tags from local storage */
    tagSuggestions: string[]
}

type Props = StateProps & DispatchProps & OwnProps

/* tslint:disable-next-line variable-name */
const TagsContainer = (props: Props) => (
    <IndexDropdown
        env={props.env}
        isForAnnotation
        allowAdd
        initFilters={props.tags}
        initSuggestions={[
            ...new Set([...props.initTagSuggestions, ...props.tagSuggestions]),
        ]}
        onFilterAdd={props.addTag}
        onFilterDel={props.deleteTag}
        source="tag"
    />
)

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    State
> = state => ({
    tags: selectors.tags(state),
    initTagSuggestions: selectors.initTagSuggestions(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps
> = dispatch => ({
    addTag: tag => dispatch(actions.addTag(tag)),
    deleteTag: tag => dispatch(actions.deleteTag(tag)),
})

export default connect(mapStateToProps, mapDispatchToProps)(TagsContainer)
