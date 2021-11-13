import * as React from 'react'
import classNames from 'classnames'
import { ButtonTooltip } from 'src/common-ui/components'
import { maxPossibleTags } from 'src/sidebar/annotations-sidebar/utils'
import { ClickHandler } from 'src/sidebar/annotations-sidebar/types'

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
        maxTagsAllowed: 100,
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
        const tags = [...new Set([...this.props.tags])]
        return tags.map((tag, index) => {
            return (
                <span key={tag} className={styles.tag}>
                    <div className={styles.tagContent}>
                        {tag}
                        <span
                            className={styles.remove}
                            onClick={this._deleteFn(tag)}
                        />
                    </div>
                </span>
            )
        })
    }

    render() {
        const { tags, clickHandler } = this.props

        return (
            <div className={styles.tagHolderContainer} onClick={clickHandler}>
                <ButtonTooltip tooltipText="Add Tags" position="bottomSidebar">
                    <div className={styles.tagHolder} onClick={clickHandler}>
                        <span
                            className={classNames(
                                styles.placeholder,
                                tags.length > 0 && styles.placeholder_alt,
                            )}
                        >
                            <span className={styles.tagIcon} />
                        </span>
                    </div>
                </ButtonTooltip>
            </div>
        )
    }
}

export default TagHolder
