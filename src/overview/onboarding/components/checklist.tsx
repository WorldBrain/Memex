import React, { PureComponent } from 'react'
import ChecklistItem from './checklist-item'

const styles = require('./checklist.css')

interface Props {
    isAnnotationChecked: boolean
    isPowerSearchChecked: boolean
    isTaggingChecked: boolean
    handleAnnotationStage: () => void
    handlePowerSearchStage: () => void
    handleTaggingStage: () => void
}

class Checklist extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <p className={styles.title}>GET STARTED</p>
                <p className={styles.subtext}>
                    with 30 sec interactive tutorials
                </p>
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
                    isChecked={this.props.isPowerSearchChecked}
                    handleClick={this.props.handlePowerSearchStage}
                    id="powerSearchChecklist"
                >
                    Tag & sort websites into collections
                </ChecklistItem>
                <p className={styles.subTitle}>
                    Learn how to add some organisation to your web-research
                </p>
            </React.Fragment>
        )
    }
}

export default Checklist
