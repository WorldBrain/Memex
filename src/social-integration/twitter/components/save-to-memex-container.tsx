import React, { Component } from 'react'
import { connect, MapStateToProps } from 'react-redux'
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
import { actions as sidebarActs } from 'src/sidebar-overlay/sidebar'
import * as acts from 'src/social-integration/actions'
import ActionBar from './action-bar'
import AnnotationsManager from 'src/sidebar-overlay/annotations-manager'
import { selectors as commentBox } from 'src/sidebar-overlay/comment-box'
import normalizeUrl from 'src/util/encode-url-for-id'

import cx from 'classnames'

const styles = require('./styles.css')

export interface StateProps {
    tags: string[]
    initTagSuggs: string[]
    collections: PageList[]
    initCollSuggs: PageList[]
    isCommentSaved: boolean
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
    element: Element
    tweet?: Tweet
    url?: string
}

export type Props = StateProps & DispatchProps & OwnProps

interface State {
    isMouseInside: boolean
    saved: boolean
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
            setTagHolder: false,
            tags: [],
        }
    }

    async componentDidMount() {
        this.memexBtnRef.addEventListener('click', this.saveTweet)
        const pageTags = await remoteFunction('fetchPageTags')(this.url)
        this.setState(state => ({
            tags: pageTags,
        }))
        this.attachTagHolder()
    }

    componentDidUpdate() {
        this.attachTagHolder()
    }

    componentWillUnMount() {
        this.memexBtnRef.removeEventListener('click', this.saveTweet)
    }

    private attachTagHolder() {
        if (
            normalizeUrl(window.location.href) === normalizeUrl(this.url) &&
            !this.state.setTagHolder
        ) {
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
            this.setState(state => ({
                setTagHolder: true,
            }))
        }
    }

    private saveTweet = async e => {
        e.preventDefault()
        try {
            const id = await this.props.saveTweet()
            this.setState(state => ({
                saved: true,
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
        this.setState(state => ({
            isMouseInside: true,
        }))
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
                        styles.actionButton,
                    )}
                    type="button"
                    data-nav="share_tweet_to_memex"
                >
                    <div
                        className="IconContainer js-tooltip"
                        data-original-title="Save To Memex"
                    >
                        <span
                            className={cx(
                                'Icon Icon--medium Icon--saveToMemex',
                                styles.memexIcon,
                                {
                                    [styles.saved]: this.state.saved,
                                },
                            )}
                        />
                        <span className="u-hiddenVisually">Save To Memex</span>
                    </div>
                </button>
                {this.state.isMouseInside && (
                    <ActionBar {...this.props} url={this.url} />
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
