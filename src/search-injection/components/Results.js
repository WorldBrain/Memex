import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Dropdown from './Dropdown'
import styles from './Results.css'

const Results = (props) => {
    const logoURL = browser.extension.getURL('img/worldbrain-logo-wo-beta.png')
    return (
        <div
            className={classNames(styles.MEMEX_CONTAINER, styles[props.position])}
        >
            <div className={styles.header}>
                <p className={styles.resultsText}>
                    You have{' '}
                    <span className={styles.resultLength}>
                        {props.totalCount} results
                    </span>{' '}
                    in your
                    <img
                        src={logoURL}
                        className={styles.logo}
                    />
                </p>
                <div className={styles.linksContainer}>
                    <a
                        className={styles.links}
                        onClick={props.seeMoreResults}
                    >
                        See all results
                    </a>
                    <a
                        className={styles.links}
                        onClick={props.toggleHideResults}
                    >
                        {props.hideResults ? 'Maximize' : 'Minimize'}
                    </a>
                </div>
                <button
                    className={styles.settingsButton}
                    onClick={props.toggleDropDown}
                />
                {props.dropdown ? (
                    <Dropdown
                        remove={props.removeResults}
                        rerender={props.changePosition}
                    />
                ) : (
                    ''
                )}
            </div>
            <div className={styles.resultsBox}>
                {// Render only if hideResults is false
                props.hideResults ? '' : props.renderResultItems()}
            </div>
        </div>
    )
}

Results.propTypes = {
    position: PropTypes.string.isRequired,
    totalCount: PropTypes.number.isRequired,
    seeMoreResults: PropTypes.func.isRequired,
    toggleHideResults: PropTypes.func.isRequired,
    hideResults: PropTypes.bool.isRequired,
    toggleDropDown: PropTypes.func.isRequired,
    dropdown: PropTypes.bool.isRequired,
    removeResults: PropTypes.func.isRequired,
    changePosition: PropTypes.func.isRequired,
    renderResultItems: PropTypes.func.isRequired,
}

export default Results
