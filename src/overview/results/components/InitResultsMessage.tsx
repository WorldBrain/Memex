import React, { PureComponent } from 'react'
import { Link } from 'react-router'

import ResultsMessage from './ResultsMessage'

const styles = require('./InitResultsMessage.css')

class InitResultsMessage extends PureComponent {
    render() {
        return (
            <ResultsMessage>
                <div className={styles.container}>
                    <div className={styles.leftParent}>
                        <p className={styles.welcome}>Welcome to your Memex</p>
                        <p className={styles.text}>
                            The all-in-one tool to get
                            <br /> on top of your online chaos.
                        </p>
                        {/* <img></img> */}
                    </div>
                    <div className={styles.rightParent}>
                        <p className={styles.title}>Let's get started</p>
                        <p className={styles.subtext}>
                            Complete the steps & get 1 month of free
                            auto-backups
                        </p>
                        <div className={styles.checklist}>
                            Make your first web annotation
                        </div>
                        <div className={styles.checklist}>
                            Do your first power search
                        </div>
                        <div className={styles.checklist}>
                            Import from your existing bookmarks & history
                        </div>
                    </div>
                </div>
            </ResultsMessage>
        )
    }
}

export default InitResultsMessage
