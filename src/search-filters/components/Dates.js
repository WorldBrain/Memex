import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'

import styles from './Dates.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';
// import DatesPopup from './DatesPopup'

class Dates extends PureComponent {
    state = {
        showPopup: false,
        dates: [],
    }

    // dates = dates => {
    //     this.setState({ dates: dates })
    // }

    // toggleDatesPopup = () => {
    //     this.setState(prevState => ({
    //         showPopup: !prevState.showPopup,
    //     }))
    // }

    render() {
        // let show = null

        if (this.state.showPopup) {
            // show = <DatesPopup checkDates={this.dates} />
        }
        // console.log(this.state.tags)

        return (
            <div className={styles.datesStyle}>
                <button
                    className={
                        this.state.count > 0
                            ? styles.dateButtonSelected
                            : styles.dateButton
                    }
                    onClick={this.toggleDatesPopup}
                >
                    Dates{' '}
                </button>
                <div style={{ display: 'grid' }}>
                    <span style={{ fontSize: '15px' }}>
                        {this.state.dates.map(type => {
                            if (type) {
                                return <span>{type} - </span>
                            }
                        })}
                    </span>
                </div>
                {/* show */}
            </div>
        )
    }
}

export default Dates
