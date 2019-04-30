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
                        <button onClick={this.handleCommentIconBtnClick}>
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M20.81 10.4048C20.8138 11.8503 20.476 13.2764 19.8243 14.5667C19.0515 16.1129 17.8635 17.4134 16.3934 18.3226C14.9232 19.2317 13.229 19.7136 11.5005 19.7143C10.0549 19.7181 8.62888 19.3803 7.33856 18.7286L1.0957 20.8095L3.17666 14.5667C2.52491 13.2764 2.18717 11.8503 2.19094 10.4048C2.19161 8.67622 2.67352 6.98199 3.58268 5.51185C4.49185 4.04171 5.79236 2.85372 7.33856 2.08096C8.62888 1.42922 10.0549 1.09148 11.5005 1.09525H12.0481C14.3309 1.22119 16.4871 2.18475 18.1038 3.80142C19.7205 5.4181 20.684 7.57429 20.81 9.85715V10.4048Z"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M11.5 6.8999V13.4999"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.36328 10.2002H14.636"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
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
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M20.81 10.4048C20.8138 11.8503 20.476 13.2764 19.8243 14.5667C19.0515 16.1129 17.8635 17.4134 16.3934 18.3226C14.9232 19.2317 13.229 19.7136 11.5005 19.7143C10.0549 19.7181 8.62888 19.3803 7.33856 18.7286L1.0957 20.8095L3.17666 14.5667C2.52491 13.2764 2.18717 11.8503 2.19094 10.4048C2.19161 8.67622 2.67352 6.98199 3.58268 5.51185C4.49185 4.04171 5.79236 2.85372 7.33856 2.08096C8.62888 1.42922 10.0549 1.09148 11.5005 1.09525H12.0481C14.3309 1.22119 16.4871 2.18475 18.1038 3.80142C19.7205 5.4181 20.684 7.57429 20.81 9.85715V10.4048Z"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M11.5 6.8999V13.4999"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.36328 10.2002H14.636"
                                    stroke="#444444"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
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
