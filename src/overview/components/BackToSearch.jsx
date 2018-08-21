import React from 'react'

import styles from './BackToSearch.css'
import * as constants from '../../constants'

const BackToSearch = props => (
    <a className={styles.mainContainer} href={constants.OVERVIEW_URL}>
        <div className={styles.image}>
            <img src="/img/triangle.svg" />
        </div>
        <div className={styles.text}>Back to Search</div>
    </a>
)

export default BackToSearch
