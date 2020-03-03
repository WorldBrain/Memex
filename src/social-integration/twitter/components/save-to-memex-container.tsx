import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
import { normalizeUrl } from '@worldbrain/memex-url-utils'

import { MapDispatchToProps } from 'src/util/types'
import RootState, { Tweet } from 'src/social-integration/types'
import { remoteFunction } from 'src/util/webextensionRPC'
import appendReactDOM from 'src/social-integration/append-react-dom'
import { TagHolder } from 'src/common-ui/components'
import { PageList } from 'src/custom-lists/background/types'
import { acts as tagActs, selectors as tags } from 'src/popup/tags-button'
import {
    selectors as collections,
    acts as collectionActs,
} from 'src/popup/collections-button'
import { Page } from 'src/sidebar-overlay/sidebar/types'
import * as sidebarActs from 'src/sidebar-overlay/sidebar/actions'
import * as acts from 'src/social-integration/actions'
import ActionBar from './action-bar'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { selectors as commentBox } from 'src/sidebar-overlay/comment-box'

import cx from 'classnames'

const styles = require('./styles.css')

export interface StateProps {
    tags: string[]
    initTagSuggs: string[]
    collections: PageList[]
    initCollSuggs: PageList[]
    isCommentSaved: boolean
    commentText: string
}

export interface DispatchProps {
    onInit: (url: string) => void
    toggleBookmark: (url: string, isBookmarked: boolean) => void
    saveTweet: () => void
    setAnnotationsManager: (annotationsManager: AnnotationsManager) => void
    setPage: (page: Page) => void
    onTagAdd: (tag: string) => void
    onTagDel: (tag: string) => void
    onCollectionAdd: (collection: PageList) => void
    onCollectionDel: (collection: PageList) => void
}

interface OwnProps {
    element: HTMLElement
    annotationsManager: AnnotationsManager
    tweet?: Tweet
    url?: string
}

export type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInside: boolean
    saved: boolean
    saving: boolean
    setTagHolder: boolean
    tags: string[]
}

class SaveToMemexContainer extends Component<Props, State> {
    private memexBtnRef: HTMLButtonElement
    private url: string

    constructor(props: Props) {
        super(props)
        this.url =
            'twitter.com' +
            this.props.element.getAttribute('data-permalink-path')

        this.state = {
            isMouseInside: false,
            saved: false,
            saving: false,
            setTagHolder: false,
            tags: [],
        }
    }

    async componentDidMount() {
        this.memexBtnRef.addEventListener('click', this.toggleTweet())
        this.attachTagHolder()
    }

    componentDidUpdate() {
        this.attachTagHolder()
    }

    componentWillUnmount() {
        this.memexBtnRef.removeEventListener('click', this.toggleTweet())
    }

    private async attachTagHolder() {
        if (
            normalizeUrl(window.location.href) === normalizeUrl(this.url) &&
            !this.state.setTagHolder
        ) {
            this.setState(state => ({
                setTagHolder: true,
            }))
            const postTags = await remoteFunction('fetchSocialPostTags')({
                url: this.url,
            })
            this.setState(state => ({
                tags: postTags,
            }))
            const tweetFooter = this.props.element.querySelector(
                '.stream-item-footer',
            )
            if (tweetFooter) {
                appendReactDOM(TagHolder, tweetFooter, {
                    tags: this.state.tags,
                    maxTagsLimit: 10,
                    handlePillClick: () => {},
                })
            }
        }
    }

    private toggleTweet = (isCallback?: boolean) => async () => {
        if (isCallback && this.state.saved) {
            return
        }
        this.setState(state => ({ saving: true }))
        try {
            const id = this.state.saved
                ? await remoteFunction('delSocialPages')([this.url])
                : await this.props.saveTweet()
            this.setState(prevState => ({
                saved: !prevState.saved,
                saving: false,
            }))
        } catch (e) {
            console.error(e)
        }
    }

    private handleMouseEnter = () => {
        this.setState(state => ({
            isMouseInside: true,
        }))
    }

    private handleMouseLeave = () => {
        if (!this.props.commentText.length) {
            this.setState(state => ({
                isMouseInside: false,
            }))
        }
    }

    render() {
        return (
            <div
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                className={cx(
                    'ProfileTweet-action ProfileTweet-action--stm',
                    styles.container,
                )}
            >
                <button
                    ref={ref => (this.memexBtnRef = ref)}
                    className={cx(
                        'ProfileTweet-actionButton u-textUserColorHover js-actionButton',
                        styles.hoverButton,
                    )}
                    type="button"
                    data-nav="share_tweet_to_memex"
                >
                    <div
                        className={cx(
                            'IconContainer js-tooltip',
                            styles.hoverArea,
                        )}
                        data-original-title="Save To Memex"
                    >
                        <span
                            className={cx(
                                'Icon Icon--medium Icon--saveToMemex',
                                styles.memexIcon,
                                {
                                    [styles.saved]: this.state.saved,
                                    [styles.saving]: this.state.saving,
                                },
                            )}
                        />
                        <span className="u-hiddenVisually">Save To Memex</span>
                    </div>
                </button>
                {this.state.isMouseInside && (
                    <ActionBar
                        {...this.props}
                        url={this.url}
                        saveTweet={this.toggleTweet}
                    />
                )}
            </div>
        )
    }
}

const mapStateToProps: MapStateToProps<
    StateProps,
    OwnProps,
    RootState
> = state => ({
    tags: tags.tags(state),
    initTagSuggs: tags.initTagSuggestions(state),
    collections: collections.collections(state),
    initCollSuggs: collections.initCollSuggestions(state),
    isCommentSaved: commentBox.isCommentSaved(state),
    commentText: commentBox.commentText(state),
})

const mapDispatchToProps: MapDispatchToProps<
    DispatchProps,
    OwnProps,
    RootState
> = (dispatch, props) => ({
    onInit: url => dispatch(acts.initState(url)),
    toggleBookmark: (url, isBookmarked) =>
        dispatch(acts.toggleBookmark(url, isBookmarked)),
    saveTweet: () => dispatch(acts.saveTweet(props.element)),
    setAnnotationsManager: annotationsManager =>
        dispatch(sidebarActs.setAnnotationsManager(annotationsManager)),
    setPage: (page: Page) => dispatch(sidebarActs.setPage(page)),
    onTagAdd: (tag: string) => dispatch(tagActs.addTagToPage(tag)),
    onTagDel: (tag: string) => dispatch(tagActs.deleteTag(tag)),
    onCollectionAdd: (collection: PageList) =>
        dispatch(collectionActs.addCollectionToPage(collection)),
    onCollectionDel: (collection: PageList) =>
        dispatch(collectionActs.deleteCollection(collection)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SaveToMemexContainer)
