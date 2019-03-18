import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'

import styles from './Domains.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';
import DomainsPopup from './DomainsPopup'

class Domains extends PureComponent {
    state = {
        showPopup: false,
    }

    openDomainsPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
        }))
    }

    render() {
        let show = null

        if (this.state.showPopup) {
            show = <DomainsPopup />
        }

        return (
            <div className={styles.domainsStyle}>
                <button
                    className={styles.domainButton}
                    onClick={this.openDomainsPopup}
                >
                    Domains
                </button>
                {show}
            </div>
        )
    }
}

export default Domains
