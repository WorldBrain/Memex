import React from 'react'

import { Checkbox } from '../../../common-ui/components'
import * as constants from '../constants'
import { browser } from 'webextension-polyfill-ts'
import { getLocalStorage, setLocalStorage } from 'src/util/storage'

const styles = require('./OnboardingChecklist.css')

class OnboardingChecklist extends React.Component {
    handleStepOne = async () => {
        const stepOneStage = await getLocalStorage(
            constants.STORAGE_KEYS.onboardingDemo.step1,
            'unvisited',
        )
        console.log(stepOneStage)

        if (stepOneStage === 'done') {
            return
        }

        const url = constants.ANNOTATION_DEMO_URL
        await setLocalStorage(
            constants.STORAGE_KEYS.onboardingDemo.step1,
            'highlight_text',
        )
        await browser.tabs.create({
            url,
        })
    }

    render() {
        return (
            <React.Fragment>
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
                        <span
                            className={styles.checklistText}
                            onClick={this.handleStepOne}
                        >
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
            </React.Fragment>
        )
    }
}

export default OnboardingChecklist
