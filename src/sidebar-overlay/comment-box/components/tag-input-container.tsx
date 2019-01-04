import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import { RootState } from '../../ribbon-sidebar-controller'
import { MapDispatchToProps } from '../../types'
import { TagInput } from '../../components'

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
const TagInputContainer = (props: Props) => <TagInput {...props} />

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
