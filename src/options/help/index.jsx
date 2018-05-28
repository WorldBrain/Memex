import React from 'react'
import { Link } from 'react-router'
import cx from 'classnames'

import localStyles from './styles.css'

const Help = () => (
    <div className={localStyles.help}>
        <span className={localStyles.title}> What can we help you with?</span>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>How do I use this tool?</p>
            Watch a{' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://worldbrain.io/tutorial"
            >
                1 min video intro{' '}
            </a>{' '}
            or read the more detailed{' '}
            <Link className={localStyles.link} to="/tutorial">
                step by step guide
            </Link>.
        </div>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>I have QUESTIONS. </p>
            You can visit our{' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://www.reddit.com/r/WorldBrain/"
            >
                FAQ section
            </a>{' '}
            or you can write us an email:{' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
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
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://www.github.com/WorldBrain/WebMemex/issues/new"
            >
                {' '}
                GitHub
            </a>. <br />
            Feature requests can be made {' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://worldbrain.typeform.com/to/KIRrZ2"
            >
                with this form{' '}
            </a>
            or via email (<a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="mailto:questions@worldbrain.io"
            >
                questions@worldbrain.io
            </a>).
        </div>

        <div className={localStyles.content}>
            <p className={localStyles.title2}>Whats your ROADMAP?</p>
            Check out our{' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://trello.com/b/mdqEuBjb/worldbrain-roadmap"
            >
                public roadmap
            </a>{' '}
            or make {' '}
            <a
                target="_blank"
                className={cx(localStyles.link, 'piwik_link')}
                href="https://worldbrain.typeform.com/to/KIRrZ2"
            >
                suggestions
            </a>{' '}
            for upcoming features.
        </div>
    </div>
)

export default Help
