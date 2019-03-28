import React, { PureComponent } from 'react'
import cx from 'classnames'
import ChecklistItem from './checklist-item'

const styles = require('./checklist.css')

interface Props {
    isAnnotationChecked: boolean
    isPowerSearchChecked: boolean
    isTaggingChecked: boolean
    isBackupChecked: boolean
    congratsMessage: boolean
    handleAnnotationStage: () => void
    handlePowerSearchStage: () => void
    handleTaggingStage: () => void
    handleBackupStage: () => void
    closeOnboardingBox: () => void
}

class Checklist extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
            <div 
                className={styles.topBar}>All you need to know to get started</div>
                <div className={styles.featureBox}>
                    <div className={styles.leftParent}>
                        <div className={styles.featureIntro}>
                            <div className={styles.featureTitle}>Search through your history</div>
                            <div className={styles.featureText}>Type this shortcut into the address bar of the browser. Search with any word you remember about websites you’ve visited.</div>
                        </div>
                        <div className={styles.tutorial}>
                            <div className={styles.keyboardM}>M</div>
                            <div className={styles.keyboardPlus}>+</div>
                            <div className={styles.keyboardSpace}>Space</div>
                        </div>
                        <div 
                            className={styles.tryButton}
                            onClick={this.props.handlePowerSearchStage}
                            >
                            Try it!
                        </div>
                    </div>
                    <div className={styles.rightParent}>
                        <div className={styles.featureIntro}>
                            <div className={styles.featureTitle}>Add your notes to the web</div>
                            <div className={styles.featureText}>Highlight any piece of text on the web and attach notes & tags</div>
                        </div>
                        <div className={styles.tutorial}>
                            <span className={styles.infoGif}/>
                        </div>
                    <div 
                        className={styles.tryButton}
                        onClick={this.props.handleAnnotationStage}
                        >
                        Try it!
                    </div>
                </div>
            </div>
            </React.Fragment>
        )
    }
}

export default Checklist
