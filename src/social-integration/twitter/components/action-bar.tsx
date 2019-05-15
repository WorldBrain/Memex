import React, { Component } from 'react'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import CommentBoxContainer from 'src/sidebar-overlay/comment-box'
import ActionBarItems from './action-bar-items'
import { Props } from './save-to-memex-container'

const styles = require('./styles.css')

class ActionBar extends Component<Props> {
    componentDidMount() {
        this.props.onInit(this.props.url)
        this.props.setAnnotationsManager(this.props.annotationsManager)
    }

    componentWillUnmount() {
        this.props.setPage({
            url: location.href,
            title: document.title,
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
            title: document.title,
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
