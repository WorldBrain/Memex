import React, { Component } from 'react'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import CommentBoxContainer from 'src/sidebar-overlay/comment-box'
import ActionBarItems from './action-bar-items'
import { StateProps, DispatchProps } from './save-to-memex-container'
import AnnotationsManager from 'src/sidebar-overlay/annotations-manager'

const styles = require('./styles.css')

interface OwnProps {
    url: string
}

type Props = StateProps & DispatchProps & OwnProps

class ActionBar extends Component<Props> {
    private annotationsManager: AnnotationsManager

    constructor(props: Props) {
        super(props)
        this.annotationsManager = new AnnotationsManager()
    }

    componentDidMount() {
        this.props.onInit()
        this.props.setAnnotationsManager(this.annotationsManager)
    }

    componentWillUnMount() {
        this.props.setPage({
            url: null,
            title: null,
        })
    }

    private renderTagsManager() {
        return (
            <IndexDropdown
                url={this.props.url}
                source="tag"
                initFilters={this.props.tags}
                initSuggestions={this.props.initTagSuggs}
                onFilterAdd={this.props.onTagAdd}
                onFilterDel={this.props.onTagDel}
                isForRibbon
                fromOverview
            />
        )
    }

    private renderCollectionsManager() {
        return (
            <AddListDropdownContainer
                url={this.props.url}
                initLists={this.props.collections}
                initSuggestions={this.props.initCollSuggs}
                onFilterAdd={this.props.onCollectionAdd}
                onFilterDel={this.props.onCollectionDel}
                isForRibbon
            />
        )
    }

    private renderCommentBox() {
        this.props.setPage({
            url: this.props.url,
            title: null,
        })

        return <CommentBoxContainer env="inpage" />
    }

    render() {
        return (
            <div className={styles.iconsContainerTransparent}>
                <ActionBarItems
                    url={this.props.url}
                    isCommentSaved={this.props.isCommentSaved}
                    commentBox={this.renderCommentBox()}
                    tagManager={this.renderTagsManager()}
                    collectionsManager={this.renderCollectionsManager()}
                    toggleBookmark={this.props.toggleBookmark}
                />
            </div>
        )
    }
}

export default ActionBar
