import React from 'react'
import PropTypes from 'prop-types'

import { maxPossibleTags } from '../../utils'
import styles from './TagHolder.css'

/**
 * Dummy Tag Holder to display all the tags
 */

class TagHolder extends React.Component {
    static propTypes = {
        tags: PropTypes.arrayOf(PropTypes.object).isRequired,
        clickHandler: PropTypes.func.isRequired,
        deleteTag: PropTypes.func,
    }

    state = {
        maxTagsAllowed: null,
    }

    componentDidMount() {
        this.findMaxTagsAllowed()
    }

    componentDidUpdate(prevProps) {
        if (this.props.tags.length !== prevProps.tags.length) {
            this.findMaxTagsAllowed()
        }
    }

    findMaxTagsAllowed() {
        if (!this.props.tags.length) {
            return
        }
        const maxTagsAllowed = maxPossibleTags(this.props.tags)
        this.setState({
            maxTagsAllowed,
        })
    }

    deleteFn = ({ name, url }) => e => {
        e.preventDefault()
        e.stopPropagation()
        this.props.deleteTag({
            tag: name,
            url,
        })
    }

    renderTags() {
        return this.props.tags.map((tag, index) => {
            if (index >= this.state.maxTagsAllowed) {
                return null
            }
            return (
                <span key={tag.name} className={styles.tag}>
                    {tag.name}
                    <span className={styles.cross} onClick={this.deleteFn(tag)}>
                        x
                    </span>
                </span>
            )
        })
    }

    renderTagsLeft() {
        const { maxTagsAllowed } = this.state
        const { tags } = this.props

        if (!maxTagsAllowed || !(tags.length - maxTagsAllowed)) {
            return null
        }
        const tagsLeft = this.props.tags.length - this.state.maxTagsAllowed
        if (tagsLeft < 1) {
            return null
        }
        return <span className={styles.tagsLeft}>+{tagsLeft}</span>
    }

    render() {
        return (
            <div className={styles.tagHolder} onClick={this.props.clickHandler}>
                {!this.props.tags.length ? (
                    <span className={styles.placeholder}>Tag Comment...</span>
                ) : null}

                {this.renderTags()}
                {this.renderTagsLeft()}
                <span className={styles.plus}>+</span>
            </div>
        )
    }
}

export default TagHolder
