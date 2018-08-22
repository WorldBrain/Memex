import React, { PureComponent } from 'react'

import { OVERVIEW_URL } from '../../../constants'

const styles = require('./BackToSearch.css')

class BackToSearch extends PureComponent {
    render() {
        return (
            <a className={styles.mainContainer} href={OVERVIEW_URL}>
                <div className={styles.image}>
                    <img src="/img/triangle.svg" />
                </div>
                <div className={styles.text}>Back to Search</div>
            </a>
        )
    }
}

export default BackToSearch
