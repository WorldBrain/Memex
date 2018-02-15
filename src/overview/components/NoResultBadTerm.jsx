import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './NoResult.css'

const NoResultBadTerm = ({ children }) => (
    <div>
        <div className={localStyles.title}>No Results </div>
        <div className={localStyles.subtitle}>
            {children}
            <br />
            <br />
        </div>
        <div className={localStyles.subsubtitle}>
            We know there is still a lot of{' '}
            <a target="_new" href="https://worldbrain.io/help">
                room to improve
            </a>.
        </div>
        <div className={localStyles.btnBox}>
            <a target="_new" href="https://worldbrain.helprace.com/">
                <button className={localStyles.button}>Report a Problem</button>
            </a>
            <a target="_new" href="https://eepurl.com/dkmJfr">
                <button className={localStyles.button}>
                    Get Monthly Updates
                </button>
            </a>
        </div>
    </div>
)

NoResultBadTerm.propTypes = {
    children: PropTypes.string.isRequired,
}

export default NoResultBadTerm
