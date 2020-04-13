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

class TagAnnotationContainer extends React.Component<Props> {
    handleTagsUpdate = async (_: string[], added: string, deleted: string) => {
        // TODO: is it the case we don't need to update the backed here because the annotation tags are handled differently by some paren
        // component or prop? Where's the URL / ID ?
        // const backedResult = remoteFunction('editAnnotationTags')({ added, deleted, url: this.props.url})
        if (added) {
            this.props.onAnnotationTagAdd(added)
        }
        if (deleted) {
            return this.props.onAnnotationTagDel(deleted)
        }
        // return backedResult
    }

    handleTagQuery = (query: string) => tags.searchForTagSuggestions({ query })
    fetchTagsForAnnotation = async () => [] // this.props.selected
    fetchTagSuggestions = () => [
        ...new Set([
            ...this.props.initTagSuggestions,
            ...this.props.tagSuggestions,
        ]),
    ]

    render = () => (
        <TagPicker
            loadDefaultSuggestions={this.fetchTagSuggestions}
            queryTags={this.handleTagQuery}
            onUpdateTagSelection={this.handleTagsUpdate}
            initialSelectedTags={this.fetchTagsForAnnotation}
        />
    )
}

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
    onAnnotationTagAdd: tag => dispatch(actions.addTag(tag)),
    onAnnotationTagDel: tag => dispatch(actions.deleteTag(tag)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TagAnnotationContainer)
