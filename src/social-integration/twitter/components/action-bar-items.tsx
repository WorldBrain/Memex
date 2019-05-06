import React, { Component, ReactNode } from 'react'
import { Tooltip, ButtonTooltip } from 'src/common-ui/components/'
import cx from 'classnames'

const styles = require('./styles.css')

interface Props {
    url: string
    tagManager: ReactNode
    collectionsManager: ReactNode
    commentBox: ReactNode
    toggleBookmark: (url: string, isBookmarked: boolean) => void
}

interface State {
    showCommentBox: boolean
    showTagsPicker: boolean
    showCollPicker: boolean
    isBookmarked: boolean
}

const defaultState: State = {
    showCommentBox: false,
    showTagsPicker: false,
    showCollPicker: false,
    isBookmarked: false,
}

class ActionBarItems extends Component<Props, State> {
    private tagBtnRef: HTMLButtonElement
    private bmBtnRef: HTMLButtonElement
    private collBtnRef: HTMLButtonElement
    private commentBtnRef: HTMLButtonElement

    constructor(props) {
        super(props)
        this.state = defaultState
    }

    componentDidMount() {
        this.attachEventListeners()
    }

    componentWillUnMount() {
        this.removeEventListeners
    }

    private attachEventListeners() {
        this.commentBtnRef.addEventListener('click', this.handleCommentClick)
        this.tagBtnRef.addEventListener('click', this.handleTagClick)
        this.bmBtnRef.addEventListener('click', this.handleBookmarkClick)
        this.collBtnRef.addEventListener('click', this.handleCollClick)
    }

    private removeEventListeners() {
        this.commentBtnRef.removeEventListener('click', this.handleCommentClick)
        this.tagBtnRef.removeEventListener('click', this.handleTagClick)
        this.bmBtnRef.removeEventListener('click', this.handleBookmarkClick)
        this.collBtnRef.removeEventListener('click', this.handleCollClick)
    }

    private handleTagClick = e => {
        this.setState(prevState => ({
            ...defaultState,
            showTagsPicker: !prevState.showTagsPicker,
        }))
    }

    private handleCollClick = e => {
        this.setState(prevState => ({
            ...defaultState,
            showCollPicker: !prevState.showCollPicker,
        }))
    }

    private handleCommentClick = e => {
        this.setState(prevState => ({
            ...defaultState,
            showCommentBox: !prevState.showCommentBox,
        }))
    }

    private handleBookmarkClick = async e => {
        try {
            await this.props.toggleBookmark(
                this.props.url,
                this.state.isBookmarked,
            )
        } catch (e) {
            console.error(e)
            return
        }
        this.setState(prevState => ({
            isBookmarked: !prevState.isBookmarked,
        }))
    }

    render() {
        return (
            <div className={styles.iconsContainer}>
                <div className={styles.icons}>
                    <div>
                        <button
                            ref={ref => (this.commentBtnRef = ref)}
                            className={cx(styles.button, styles.commentIcon)}
                        />
                        {this.state.showCommentBox && (
                            <Tooltip position="bottom">
                                {this.props.commentBox}
                            </Tooltip>
                        )}
                    </div>
                    <div>
                        <button
                            ref={ref => (this.bmBtnRef = ref)}
                            className={cx(styles.button, {
                                [styles.bookmark]: this.state.isBookmarked,
                                [styles.notBookmark]: !this.state.isBookmarked,
                            })}
                        />
                    </div>
                    <div>
                        <button
                            ref={ref => (this.tagBtnRef = ref)}
                            className={cx(styles.button, styles.tagIcon)}
                        />
                        {this.state.showTagsPicker && (
                            <Tooltip position="bottom">
                                {this.props.tagManager}
                            </Tooltip>
                        )}
                    </div>
                    <div>
                        <button
                            ref={ref => (this.collBtnRef = ref)}
                            className={cx(styles.button, styles.collIcon)}
                        />
                        {this.state.showCollPicker && (
                            <Tooltip position="bottom">
                                {this.props.collectionsManager}
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        )
    }
}

export default ActionBarItems
