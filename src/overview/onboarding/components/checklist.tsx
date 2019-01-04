import React, { PureComponent } from 'react'
import cx from 'classnames'
import ChecklistItem from './checklist-item'

const styles = require('./checklist.css')

interface Props {
    isAnnotationChecked: boolean
    isPowerSearchChecked: boolean
    isTaggingChecked: boolean
    congratsMessage: boolean
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
                <p className={styles.title}>
                    {!this.props.congratsMessage ? (
                        'GET STARTED'
                    ) : (
                        <span>CONGRATS!</span>
                    )}
                </p>
                <p className={styles.subtext}>
                    {!this.props.congratsMessage
                        ? 'with 30 sec interactive tutorials'
                        : 'You have completed all tutorials'}
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
                    iconClass="close"
                    subtitle="Learn how to add highlights and notes to websites"
                >
                    Make your first web annotation
                </ChecklistItem>
                <ChecklistItem
                    isChecked={this.props.isPowerSearchChecked}
                    handleClick={this.props.handlePowerSearchStage}
                    iconClass="close"
                    subtitle="Learn how to full-text search your browser history and
                    bookmarks"
                >
                    Do your first History search
                </ChecklistItem>
                <ChecklistItem
                    isChecked={this.props.isTaggingChecked}
                    handleClick={this.props.handleTaggingStage}
                    iconClass="close"
                    subtitle="Learn how to add some organisation to your web-research"
                >
                    Tag & sort websites into collections
                </ChecklistItem>
            </div>
        )
    }
}

export default Checklist
