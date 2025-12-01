import React, { PureComponent, MouseEventHandler } from 'react'
import TagPill from './tag-pill'
import cx from 'classnames'

interface Props {
    tags: string[]
    maxTagsLimit: number
    setTagManagerRef?: (e: HTMLSpanElement) => any
    handlePillClick: (tag: string) => MouseEventHandler
    handleTagBtnClick?: MouseEventHandler
    env: string
}

class TagHolder extends PureComponent<Props, {}> {
    renderTagPills() {
        const {
            tags,
            maxTagsLimit,
            setTagManagerRef,
            handlePillClick,
            handleTagBtnClick,
            env,
        } = this.props

        if (!(tags && tags.length)) {
            return null
        }

        const pills = tags
            .slice(0, maxTagsLimit)
            .map((tag, i) => (
                <TagPill key={i} value={tag} onClick={handlePillClick(tag)} />
            ))

        // Append Add Tag manager and return
        return [...pills]
    }

    render() {
        return <div>{this.renderTagPills()}</div>
    }
}

export default TagHolder
