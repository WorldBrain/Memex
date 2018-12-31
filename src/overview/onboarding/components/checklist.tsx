import React, { PureComponent } from 'react'
import ChecklistItem from './checklist-item'

const styles = require('./checklist.css')

interface Props {
    isAnnotationChecked: boolean
    isPowerSearchChecked: boolean
    handleAnnotationStage: () => void
    handlePowerSearchStage: () => void
}

class Checklist extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <p className={styles.title}>Let's get started</p>
                <p className={styles.subtext}>
                    Complete the steps & get 1 month of free auto-backups
                </p>
                <ChecklistItem
                    isChecked={this.props.isAnnotationChecked}
                    handleClick={this.props.handleAnnotationStage}
                    id="annotationChecklist"
                >
                    Make your first web annotation
                </ChecklistItem>
                <ChecklistItem
                    isChecked={this.props.isPowerSearchChecked}
                    handleClick={this.props.handlePowerSearchStage}
                    id="powerSearchChecklist"
                >
                    Do your first power search
                </ChecklistItem>
                <ChecklistItem
                    isChecked={false}
                    handleClick={() => null}
                    id="addTagsChecklist"
                >
                    Add Tags/Collections
                </ChecklistItem>
            </React.Fragment>
        )
    }
}

export default Checklist
