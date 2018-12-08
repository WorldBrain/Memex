import React from 'react'

import { Checkbox } from '../../../common-ui/components'

const styles = require('./InitResultsMessage.css')

class OnboardingChecklist extends React.Component {
    render() {
        return (
            <>
                <p className={styles.title}>Let's get started</p>
                <p className={styles.subtext}>
                    Complete the steps & get 1 month of free auto-backups
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
                            Import from your existing bookmarks & history{' '}
                        </span>
                    </Checkbox>
                </div>
            </>
        )
    }
}

export default OnboardingChecklist
