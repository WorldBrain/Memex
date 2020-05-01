import * as React from 'react'
import { connect, MapStateToProps } from 'react-redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import State from '../types'
import { MapDispatchToProps } from '../../types'
import { remoteFunction } from 'src/util/webextensionRPC'
import { tags } from 'src/util/remote-functions-background'
import TagPicker from 'src/tags/ui/TagPicker'

interface StateProps {
    tags: string[]
    initTagSuggestions: string[]
}

interface DispatchProps {
    onAnnotationTagAdd: (tag: string) => void
    onAnnotationTagDel: (tag: string) => void
}

interface OwnProps {
    // url: string
    tagSuggestions: string[]
    // and selected?
}

type Props = StateProps & DispatchProps & OwnProps

// N.B. this is used for creating new annotations
class TagAnnotationContainer extends React.Component<Props> {
    handleTagsUpdate = async (_: string[], added: string, deleted: string) => {
        if (added) {
            this.props.onAnnotationTagAdd(added)
        }
        if (deleted) {
            return this.props.onAnnotationTagDel(deleted)
        }
    }

    handleTagQuery = (query: string) => tags.searchForTagSuggestions({ query })
    fetchTagsForAnnotation = async () => this.props.tags

    render = () => (
        <TagPicker
            loadDefaultSuggestions={tags.fetchInitialTagSuggestions}
            queryEntries={this.handleTagQuery}
            onUpdateEntrySelection={this.handleTagsUpdate}
            initialSelectedEntries={this.fetchTagsForAnnotation}
        />
    )
}

const mapStateToProps: MapStateToProps<StateProps, OwnProps, State> = (
    state,
) => ({
    tags: selectors.tags(state),
    initTagSuggestions: selectors.initTagSuggestions(state),
})

const mapDispatchToProps: MapDispatchToProps<DispatchProps, OwnProps> = (
    dispatch,
) => ({
    onAnnotationTagAdd: (tag) => dispatch(actions.addTag(tag)),
    onAnnotationTagDel: (tag) => dispatch(actions.deleteTag(tag)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TagAnnotationContainer)
