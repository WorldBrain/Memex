import React from 'react'
import PropTypes from 'prop-types'

import localStyles from './NoResult.css'

const NoResultBadTerm = ({ title = 'No Results', children }) => (
    <div>
        <div className={localStyles.title}>{title}</div>
        <div className={localStyles.subtitle}>
            {children}
            <br />
            <br />
        </div>
        <div className={localStyles.subsubtitle}>
            We know there is still a lot of{' '}
            <a
                className={localStyles.link}
                target="_new"
                href="https://worldbrain.helprace.com/i23-known-limitations-of-searching"
            >
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
    title: PropTypes.string,
    children: PropTypes.string.isRequired,
}

export default NoResultBadTerm
