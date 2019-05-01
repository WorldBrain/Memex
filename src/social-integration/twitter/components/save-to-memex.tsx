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
            'https://twitter.com' +
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
                            data-item-id={id}
                        >
                            <span className="Icon Icon--medium Icon--saveToMemex">
                                <svg
                                    width="22"
                                    height="22"
                                    viewBox="0 0 22 22"
                                    fill="none"
                                    className={cx(styles.memexIcon, {
                                        [styles.saved]: this.state.saved,
                                    })}
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
                            </span>
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
