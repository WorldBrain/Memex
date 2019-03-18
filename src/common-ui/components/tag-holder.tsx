import React, { PureComponent, MouseEventHandler } from 'react'
import TagPill from './tag-pill'

const styles = require('./tag-holder.css')

interface Props {
    tags: string[]
    maxTagsLimit: number
    setTagManagerRef?: (e: HTMLSpanElement) => any
    handlePillClick: (tag: string) => MouseEventHandler
    handleTagBtnClick: MouseEventHandler
}

class TagHolder extends PureComponent<Props, {}> {
    renderTagPills() {
        const {
            tags,
            maxTagsLimit,
            setTagManagerRef,
            handlePillClick,
            handleTagBtnClick,
        } = this.props

        if (!tags.length) {
            return null
        }

        const pills = tags
            .slice(0, maxTagsLimit)
            .map((tag, i) => (
                <TagPill key={i} value={tag} onClick={handlePillClick(tag)} />
            ))

        // Append Add Tag manager and return
        return [
            ...pills,
            <TagPill
                key="+"
                setRef={setTagManagerRef}
                value={`+ Add`}
                onClick={handleTagBtnClick}
                noBg
            />,
        ]
    }

    render() {
        return <div className={styles.tagList}>{this.renderTagPills()}</div>
    }
}

export default TagHolder
