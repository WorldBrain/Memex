import React, { PureComponent } from 'react'

// import ReactDOM from 'react-dom'

import styles from './Domains.module.css'
// import DatesPopup from './DatesPopup';
// import DateRangeSelection from './DateRangeSelection';
import DomainsPopup from './DomainsPopup'

class Domains extends PureComponent {
    state = {
        showPopup: false,
        count: 0,
        domains: [],
    }

    count = count => {
        this.setState({ count: count })
    }

    domains = domains => {
        this.setState({ domains: domains })
    }

    openDomainsPopup = () => {
        this.setState(prevState => ({
            showPopup: !prevState.showPopup,
        }))
    }

    render() {
        let show = null

        if (this.state.showPopup) {
            show = (
                <DomainsPopup
                    checkCount={this.count}
                    checkDomains={this.domains}
                />
            )
        }

        // console.log(this.state.domains)

        return (
            <div className={styles.domainsStyle}>
                <button
                    className={
                        this.state.count > 0
                            ? styles.domainButtonSelected
                            : styles.domainButton
                    }
                    onClick={this.openDomainsPopup}
                >
                    Domains{' '}
                    {this.state.count === 0 ? (
                        ''
                    ) : (
                        <span
                            style={{
                                fontWeight: 'bold',
                                paddingLeft: '4px',
                            }}
                        >
                            {this.state.count}
                        </span>
                    )}
                </button>
                <div style={{ display: 'grid' }}>
                    <span style={{ fontSize: '15px' }}>
                        {this.state.domains.map((type, index) => {
                            if (type) {
                                return <span>{type}, </span>
                            }
                        })}
                    </span>
                </div>
                {show}
            </div>
        )
    }
}

export default Domains
