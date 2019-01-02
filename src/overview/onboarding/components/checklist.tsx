import React, { PureComponent } from 'react'
import cx from 'classnames'
import ChecklistItem from './checklist-item'

const styles = require('./checklist.css')

interface Props {
    isAnnotationChecked: boolean
    isPowerSearchChecked: boolean
    isTaggingChecked: boolean
    isRightBox?: boolean
    handleAnnotationStage: () => void
    handlePowerSearchStage: () => void
    handleTaggingStage: () => void
    closeOnboardingBox: () => void
}

class Checklist extends PureComponent<Props> {
    render() {
        return (
            <div
                className={cx({
                    [styles.container]: this.props.isRightBox,
                })}
            >
                <p className={styles.title}>GET STARTED</p>
                <p className={styles.subtext}>
                    with 30 sec interactive tutorials
                </p>

                {this.props.isRightBox ? (
                    <span
                        className={styles.close}
                        onClick={this.props.closeOnboardingBox}
                    />
                ) : null}

                <ChecklistItem
                    isChecked={this.props.isAnnotationChecked}
                    handleClick={this.props.handleAnnotationStage}
                    id="annotationChecklist"
                >
                    Make your first web annotation
                </ChecklistItem>
                <p className={styles.subTitle}>
                    Learn how to add highlights and notes to websites
                </p>
                <ChecklistItem
                    isChecked={this.props.isPowerSearchChecked}
                    handleClick={this.props.handlePowerSearchStage}
                    id="powerSearchChecklist"
                >
                    Do your first History search
                </ChecklistItem>
                <p className={styles.subTitle}>
                    Learn how to full-text search your browser history and
                    bookmarks
                </p>
                <ChecklistItem
                    isChecked={this.props.isTaggingChecked}
                    handleClick={this.props.handleTaggingStage}
                    id="powerSearchChecklist"
                >
                    Tag & sort websites into collections
                </ChecklistItem>
                <p className={styles.subTitle}>
                    Learn how to add some organisation to your web-research
                </p>
            </div>
        )
    }
}

export default Checklist
