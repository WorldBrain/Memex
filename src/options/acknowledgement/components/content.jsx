import React from 'react'
import cx from 'classnames'

import localStyles from './styles.css'

const AcknowledgementContainer = () => (
    <div className={localStyles.acknowledgement}>
        <span className={localStyles.title}>
            WorldBrain's Memex can only happen thanks to our talented
            collaborators.
        </span>
        <div className={localStyles.content}>
            Many thanks goes out to our{' '}
            <a
                className={cx(localStyles.links, 'piwik_link')}
                href="https://worldbrain.io/team"
                target="_blank"
            >
                team of contributors, advisors and investors
            </a>
            {''}who helped building our software.
            <br />We also have immense grattitude for the decades-long pioneer
            work done by technologists and philosophers that enabled the
            WorldBrain's Memex project with their pieces of code and thought.
            <br />
            <br />This software is{' '}
            <a
                className={cx(localStyles.links, 'piwik_link')}
                target="_blank"
                href="https://github.com/WorldBrain/WebMemex/blob/master/License"
            >
                open-source
            </a>, for anyone to reuse, recycle, redistribute and add to.
        </div>

        <span className={localStyles.contribute}>
            You want to contribute to this project?
        </span>
        <p className={localStyles.contributeContent}>
            You can do so either by supporting our development with{' '}
            <a
                className={cx(localStyles.links, 'piwik_link')}
                href="https://github.com/WorldBrain/WebMemex/"
                target="_blank"
            >
                your mind
            </a>{' '}
            or{' '}
            <a
                className={cx(localStyles.links, 'piwik_link')}
                href="https://patreon.com/WorldBrain"
                target="_blank"
            >
                your money
            </a>.
        </p>
    </div>
)

export default AcknowledgementContainer
