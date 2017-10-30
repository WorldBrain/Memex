import React from 'react'

import styles from '../options.css'
import localStyles from './styles.css'

const HelpContainer = () => (
    <div className={localStyles.help}>
        <span className={localStyles.title}> What can we help you with?</span>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>How do I use this tool?</p>
            Watch our 1 min tutorials or read step by step guides
        </div>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>I have QUESTIONS. </p>
            You can visit our{' '}
            <a
                className={localStyles.link}
                href="https://www.reddit.com/r/WorldBrain/"
            >
                FAQ section
            </a>{' '}
            or you can write us an email:{' '}
            <a
                className={localStyles.link}
                href="mailto:questions@worldbrain.io"
            >
                questions@worldbrain.io
            </a>
        </div>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>
                I want to report a BUG or make a FEATURE REQUEST
            </p>
            Bugs you best report on{' '}
            <a
                className={localStyles.link}
                href="https://www.github.com/WorldBrain/WebMemex/issues/new"
            >
                {' '}
                on GitHub
            </a>. Feature requests can be made either via email (<a
                className={localStyles.link}
                href="mailto:questions@worldbrain.io"
            >
                questions@worldbrain.io
            </a>) or on our Trello board.
        </div>
    </div>
)

export default HelpContainer
