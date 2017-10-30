import React from 'react'

import styles from '../../options.css'
import localStyles from './styles.css'

const AcknowledgementContainer = () => (
    <div className={localStyles.acknowledgement}>
        <span className={localStyles.title}>
            WorldBrain can only happen thanks to our talented collaborators.
        </span>
        <div className={localStyles.content}>
            Many thanks goes out to our{' '}
            <a href="https://worldbrain.io/team">
                team of contributors, advisors and investors
            </a>{' '}
            who helped building our software.
            <br />We also have immense grattitude for the decades long pioneer
            work done by technologists and philosophers contributing the
            foundational pieces of code and thought to make this project a
            reality.
            <br />
            <br />This software is open-source, for anyone to reuse, recycle,
            redistribute and add to.
        </div>

        <span className={localStyles.contribute}>
            You want to contribute to this project?
        </span>
        <p className={localStyles.contributeContent}>
            You can do so either by supporting our development with{' '}
            <a href="https://github.com/WorldBrain/WebMemex/">your mind</a> or{' '}
            <a href="https://patreon.com/WorldBrain">your money</a>.
        </p>
    </div>
)

export default AcknowledgementContainer
