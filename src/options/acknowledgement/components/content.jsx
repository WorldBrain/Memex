import React from 'react'
import localStyles from './styles.css'

const AcknowledgementContainer = () => (
    <div className={localStyles.acknowledgement}>
        <span className={localStyles.title}>
            WorldBrain can only happen thanks to our talented collaborators.
        </span>
        <div className={localStyles.content}>
            Many thanks goes out to our{' '}
            <a className={localStyles.links} href="https://worldbrain.io/team">
                team of contributors, advisors and investors
            </a>{' '}
            who helped building our software.
            <br />We also have immense grattitude for the decades-long pioneer
            work done by technologists and philosophers that enabled the
            WorldBrain project with their pieces of code and thought.
            <br />
            <br />This software is{' '}
            <a
                className={localStyles.links}
                href="https://github.com/WorldBrain/WebMemex/blob/master/Licence"
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
                className={localStyles.links}
                href="https://github.com/WorldBrain/WebMemex/"
            >
                your mind
            </a>{' '}
            or{' '}
            <a
                className={localStyles.links}
                href="https://patreon.com/WorldBrain"
            >
                your money
            </a>.
        </p>
    </div>
)

export default AcknowledgementContainer
