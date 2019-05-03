import 'babel-polyfill'
import React, { Component } from 'react'
import { getTweetInfo } from '../get-tweet-data'
import { remoteFunction } from 'src/util/webextensionRPC'
import appendReactDOM from 'append-react-dom'
import { TagHolder } from 'src/common-ui/components'
import ActionBar from './action-bar'

import cx from 'classnames'

const styles = require('./styles.css')

interface Props {
    element: HTMLElement
}

interface State {
    isMouseInside: boolean
    saved: boolean
    setTagHolder: boolean
    tags: string[]
}

class SaveToMemex extends Component<Props, State> {
    private addTweetRPC
    private url: string

    constructor(props: Props) {
        super(props)
        this.addTweetRPC = remoteFunction('addTweet')
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
        const tags = await remoteFunction('fetchPageTags')(this.url)
        this.setState(state => ({
            tags,
        }))
        this.attachTagHolder()
    }

    componentDidUpdate() {
        this.attachTagHolder()
    }

    private attachTagHolder() {
        if (window.location.href === this.url && !this.state.setTagHolder) {
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

    private saveTweet = async () => {
        const tweet = getTweetInfo(this.props.element)
        try {
            const id = await this.addTweetRPC(tweet)
        } catch (e) {
            console.error(e)
            return
        }
        this.setState(state => ({
            saved: true,
        }))
    }

    private handleMouseEnter = () => {
        this.setState(state => ({
            isMouseInside: true,
        }))
    }

    private handleMouseLeave = () => {
        this.setState(state => ({
            isMouseInside: false,
        }))
    }

    private handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
        e.preventDefault()
        this.saveTweet()
    }

    render() {
        const id = this.props.element.getAttribute('data-item-id')
        return (
            <div
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                className={styles.container}
            >
                <div className="ProfileTweet-action ProfileTweet-action--stm">
                    <button
                        className="ProfileTweet-actionButton u-textUserColorHover js-actionButton"
                        type="button"
                        data-nav="share_tweet_to_memex"
                        onClick={this.handleClick}
                    >
                        <div
                            className="IconContainer js-tooltip"
                            data-original-title="Save To Memex"
                            id={`memexButton-${id}`}
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
                            <span className="u-hiddenVisually">
                                Save To Memex
                            </span>
                        </div>
                    </button>
                </div>
                {/*{this.state.isMouseInside && <ActionBar url={this.url} />}*/}
            </div>
        )
    }
}

export default SaveToMemex
