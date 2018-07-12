import React from 'react'
import PropTypes from 'prop-types'

import { maxPossibleTags } from '../utils'
import styles from './TagHolder.css'

/**
 * Dummy Tag Holder to display all the tags
 */

class TagHolder extends React.Component {
    static propTypes = {
        tags: PropTypes.arrayOf(PropTypes.string).isRequired,
        clickHandler: PropTypes.func.isRequired,
    }

    state = {
        maxTagsAllowed: null,
    }

    componentDidMount() {
        if (!this.props.tags.length) return
        const maxTagsAllowed = maxPossibleTags(this.props.tags)
        this.setState({
            maxTagsAllowed,
        })
    }

    renderTagsLeft() {
        const { maxTagsAllowed } = this.state
        const { tags } = this.props

        if (!maxTagsAllowed || !(tags.length - maxTagsAllowed)) return null
        const tagsLeft = this.props.tags.length - this.state.maxTagsAllowed
        return <span className={styles.tagsLeft}>+{tagsLeft}</span>
    }

    render() {
        return (
            <div className={styles.tagHolder} onClick={this.props.clickHandler}>
                {!this.props.tags.length ? (
                    <span className={styles.placeholder}>Tag Comment...</span>
                ) : null}
                {this.props.tags.map((tag, index) => {
                    if (index >= this.state.maxTagsAllowed) return null
                    return (
                        <span key={tag} className={styles.tag}>
                            {tag}
                        </span>
                    )
                })}
                {this.renderTagsLeft()}
                <span className={styles.plus}>+</span>
            </div>
        )
    }
}

export default TagHolder
