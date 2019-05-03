import React, { Component } from 'react'
import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import CommentBoxContainer from 'src/sidebar-overlay/comment-box'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'

import cx from 'classnames'

const styles = require('./styles.css')

interface Props {
    url: string
}

interface State {
    showCommentBox: boolean
    showTagsPicker: boolean
}

class ActionBar extends Component<Props, State> {
    constructor(props) {
        super(props)
        this.state = {
            showCommentBox: false,
            showTagsPicker: false,
        }
    }

    private handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
        e.preventDefault()
    }

    private renderTagsManager() {
        return (
            <IndexDropdown
                env="inpage"
                url={this.props.url}
                initFilters={[]}
                initSuggestions={[]}
                source="tag"
                onFilterAdd={() => {}}
                onFilterDel={() => {}}
            />
        )
    }

    private renderCollectionsManager() {
        return (
            <AddListDropdownContainer
                env="inpage"
                url={this.props.url}
                initLists={[]}
                initSuggestions={[]}
                onFilterAdd={() => {}}
                onFilterDel={() => {}}
                isForRibbon
            />
        )
    }

    private handleCommentIconBtnClick: React.MouseEventHandler<
        HTMLButtonElement
    > = e => {
        this.setState(prevState => ({
            showCommentBox: !prevState.showCommentBox,
        }))
    }

    render() {
        return (
            <div className={styles.iconsContainer}>
                <div className={styles.icons}>
                    <div>
                        <button
                            onClick={this.handleCommentIconBtnClick}
                            className={styles.commentIcon}
                        />
                        {this.state.showCommentBox && (
                            <Tooltip position="bottom">
                                <CommentBoxContainer env="inpage" />
                            </Tooltip>
                        )}
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                this.setState(prevState => ({
                                    showTagsPicker: !prevState.showTagsPicker,
                                }))
                            }}
                            className={styles.tagIcon}
                        />
                        {this.state.showTagsPicker && (
                            <Tooltip position="bottom">
                                {this.renderTagsManager()}
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}

export default ActionBar
