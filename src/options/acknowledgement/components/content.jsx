import React from 'react'

import styles from '../../options.css'
import localStyles from './styles.css'

const AcknowledgementContainer = () => (
    <div className={localStyles.acknowledgement}>
        <h1 className={styles.routeTitle}>Settings &gt; Acknowledgement</h1>
        <span className={localStyles.title}>
            &gt; This project can only happen thanks to our talented
            collaborators.
        </span>
        <div className={localStyles.content}>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
        </div>

        <span className={localStyles.contribute}>How to contribue?</span>
        <p className={localStyles.contributeContent}>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
        </p>
        <div className={localStyles.col_title}>COLLABORATORS</div>
    </div>
)

export default AcknowledgementContainer
