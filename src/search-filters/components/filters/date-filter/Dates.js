import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'

import styles from '../../stylesheets/date-filter-styles/Dates.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';

class Dates extends PureComponent {
    state = {
        showPopup: false,
    }

    openTypesPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
        }))
    }

    render() {
        let show = null

        if (this.state.showPopup) {
            show = <p>Hey</p>
        }

        return (
            <div className={styles.datesStyle}>
                <button onClick={this.openTypesPopup}>Dates</button>
                {show}
            </div>
        )
    }
}

export default Dates
