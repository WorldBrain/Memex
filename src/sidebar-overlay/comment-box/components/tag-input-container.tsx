import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../ribbon-sidebar-controller'
import { IndexDropdown } from '../../../common-ui/containers'
import { MapDispatchToProps } from '../../types'
import { TagHolder } from '../../components'

interface StateProps {
    tags: string[]
    initTagSuggestions: string[]
}

interface DispatchProps {
    addTag: (tag: string) => void
    deleteTag: (tag: string) => void
}

interface OwnProps {
    isTagInputActive: boolean
    setTagInputActive: (isTagInputActive: boolean) => void
}

type Props = StateProps & DispatchProps & OwnProps

/* tslint:disable-next-line variable-name */
const TagInputContainer = ({
    isTagInputActive,
    tags,
    initTagSuggestions,
    addTag,
    deleteTag,
    setTagInputActive,
}: Props) => {
    if (isTagInputActive) {
        return (
            <IndexDropdown
                isForAnnotation
                allowAdd
                initFilters={tags}
                initSuggestions={initTagSuggestions}
                onFilterAdd={addTag}
                onFilterDel={deleteTag}
                source="tag"
            />
        )
    }

    return (
        <TagHolder
            tags={tags}
            clickHandler={e => {
                e.stopPropagation()
                setTagInputActive(true)
            }}
            deleteTag={deleteTag}
        />
    )
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
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

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TagInputContainer)
