import * as React from 'react'

import { maxPossibleTags } from '../utils'
import { ClickHandler } from '../types'

const styles = require('./tag-holder.css')

interface Props {
    tags: string[]
    clickHandler: ClickHandler<HTMLElement>
    deleteTag: (tag: string) => void
}

interface State {
    maxTagsAllowed: number
}

/**
 * Tag Holder to display all the tags.
 */
class TagHolder extends React.Component<Props, State> {
    state = {
        maxTagsAllowed: 0,
    }

    componentDidMount() {
        this._findMaxTagsAllowed()
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.tags.length !== prevProps.tags.length) {
            this._findMaxTagsAllowed()
        }
    }

    private _findMaxTagsAllowed() {
        const { tags } = this.props
        if (!tags.length) {
            return
        }
        const maxTagsAllowed = maxPossibleTags(tags)
        this.setState({ maxTagsAllowed })
    }

    private _deleteFn = (tag: string) => (
        e: React.SyntheticEvent<HTMLElement>,
    ) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.deleteTag(tag)
    }

    private _renderTags() {
        return this.props.tags.map((tag, index) => {
            if (index >= this.state.maxTagsAllowed) {
                return null
            }
            return (
                <span key={tag} className={styles.tag}>
                    {tag}
                    <span
                        className={styles.cross}
                        onClick={this._deleteFn(tag)}
                    >
                        x
                    </span>
                </span>
            )
        })
    }

    private _renderNumberOfRemainingTags() {
        const { maxTagsAllowed } = this.state
        const { tags } = this.props

        const numRemainingTags = tags.length - maxTagsAllowed
        if (!maxTagsAllowed || numRemainingTags < 1) {
            return null
        }

        return <span className={styles.tagsLeft}>+{numRemainingTags}</span>
    }

    render() {
        const { tags, clickHandler } = this.props

        return (
            <div className={styles.tagHolder} onClick={clickHandler}>
                {!tags.length && (
                    <span className={styles.placeholder}>Tag Comment...</span>
                )}

                {this._renderTags()}
                {this._renderNumberOfRemainingTags()}
                <span className={styles.plus}>+</span>
            </div>
        )
    }
}

export default TagHolder
