import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Dropdown from './Dropdown'
import styles from './Results.css'
import LoadingIndicator from 'src/common-ui/components/LoadingIndicator'


const Results = props => {
    const searchEngineClass = `${props.searchEngine}_${props.position}`

    return (
        <div
            className={classNames(
                styles.MEMEX_CONTAINER,
                styles[searchEngineClass], {
                [styles.MEMEX_CONTAINER_SMALL]: props.hideResults }
            )}
        >
            <div className={styles.header}>
                <span className={styles.resultsText}>
                    <span className={styles.resultLength}>
                        {props.totalCount}
                    </span>{' '}
                    Memex results 
                    <a className={styles.links} onClick={props.seeMoreResults}>
                        See all
                    </a>
                </span>
                <div className={styles.linksContainer}>
                    
                    <a
                        className={styles.links}
                        onClick={props.toggleHideResults}
                    >
                        {props.hideResults ? 'Maximize' : 'Minimize'}
                    </a>
                </div>
                <button
                    className={styles.settingsButton}
                    onClick={props.toggleDropdown}
                />
                {props.dropdown ? (
                    <Dropdown
                        remove={props.removeResults}
                        rerender={props.changePosition}
                        closeDropdown={props.closeDropdown}
                    />
                ) : (
                    ''
                )}
            </div>
            <div className={classNames(styles.noDisplay, {
                [styles.notification]: props.renderNotification,
            })}>
            {props.renderNotification}
            </div>
            <div className={classNames(styles.resultsBox, {
                [styles.isBlurred]: props.renderNotification,
                [styles.resultsBoxHidden]: props.hideResults,
            })}>
                {// Render only if hideResults is false
                props.hideResults ? ('') : (props.renderResultItems().length >= 0 ? (props.renderResultItems()):(<div className={styles.loadingBox}><LoadingIndicator/></div>))
                }
            </div>
        </div>
    )
}

Results.propTypes = {
    position: PropTypes.string.isRequired,
    searchEngine: PropTypes.string.isRequired,
    totalCount: PropTypes.number.isRequired,
    seeMoreResults: PropTypes.func.isRequired,
    toggleHideResults: PropTypes.func.isRequired,
    hideResults: PropTypes.bool.isRequired,
    toggleDropdown: PropTypes.func.isRequired,
    closeDropdown: PropTypes.func.isRequired,
    dropdown: PropTypes.bool.isRequired,
    removeResults: PropTypes.func.isRequired,
    changePosition: PropTypes.func.isRequired,
    renderResultItems: PropTypes.func.isRequired,
    renderNotification: PropTypes.node,
}

export default Results
