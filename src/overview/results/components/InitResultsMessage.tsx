import React, { PureComponent } from 'react'
import { Link } from 'react-router'

import { Checkbox } from '../../../common-ui/components'
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
                        <div className={styles.privacyImage} />
                    </div>
                    <div className={styles.rightParent}>
                        <p className={styles.title}>Let's get started</p>
                        <p className={styles.subtext}>
                            Complete the steps & get 1 month of free
                            auto-backups
                        </p>
                        <div className={styles.checklist}>
                            <Checkbox
                                isChecked={false}
                                handleChange={() => null}
                                id="step1"
                            >
                                {' '}
                                <span className={styles.checklistText}>
                                    Make your first web annotation{' '}
                                </span>
                            </Checkbox>
                        </div>
                        <div className={styles.checklist}>
                            <Checkbox
                                isChecked={false}
                                handleChange={() => null}
                                id="step2"
                            >
                                {' '}
                                <span className={styles.checklistText}>
                                    Do your first power search{' '}
                                </span>
                            </Checkbox>
                        </div>
                        <div className={styles.checklist}>
                            <Checkbox
                                isChecked={false}
                                handleChange={() => null}
                                id="step3"
                            >
                                {' '}
                                <span className={styles.checklistText}>
                                    Import from your existing bookmarks &
                                    history{' '}
                                </span>
                            </Checkbox>
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    {/* <img></img> */}
                    <div className={styles.textContainer}>
                        <p className={styles.bold}>
                            ALL DATA STORED ON YOUR COMPUTER
                        </p>
                        <p className={styles.subtextGreen}>
                            Your data is not our business model
                        </p>
                    </div>
                    <div className={styles.learnMore}>learn more</div>
                    <div className={styles.settings} />
                </div>
            </ResultsMessage>
        )
    }
}

export default InitResultsMessage
