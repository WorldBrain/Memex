import React from 'react'
import PropTypes from 'prop-types'

import ResultItem from './ResultItem'
import * as constants from '../constants'
import { getLocalStorage, setLocalStorage } from '../utils'

import styles from './Results.css'

class Results extends React.Component {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
        len: PropTypes.number.isRequired,
    }

    constructor(props) {
        super(props)

        this.seeMoreResults = this.seeMoreResults.bind(this)
        this.toggleHideResults = this.toggleHideResults.bind(this)
    }

    state = {
        hideResults: false,
    }

    async componentDidMount() {
        const hideResults = await getLocalStorage(constants.HIDE_RESULTS_KEY)
        this.setState({
            hideResults,
        })
    }

    renderResultItems() {
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem key={i} {...result} />
        ))
        return resultItems
    }

    seeMoreResults() {
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')
        const url = `${constants.OVERVIEW_URL}?query=${query}`
        const message = {
            action: 'openOverviewURL',
            url,
        }
        browser.runtime.sendMessage(message)
    }

    async toggleHideResults() {
        const toggled = !this.state.hideResults
        await setLocalStorage(constants.HIDE_RESULTS_KEY, toggled)
        this.setState({
            hideResults: toggled,
        })
    }

    render() {
        return (
            <div className={styles.MEMEX_CONTAINER}>
                <div className={styles.resultsText}>
                    You have <span>{this.props.len}</span> results in your
                    digital memory.
                    <button
                        className={styles.settingsButton}
                        onClick={this.toggleHideResults}
                    />
                </div>
                <div className={styles.logoContainer}>
                    <a
                        className={styles.seeAllResults}
                        onClick={this.seeMoreResults}
                    >
                        See all results
                    </a>
                    <img
                        src={constants.MEMEX_LOGO_URL}
                        className={styles.logo}
                    />
                </div>
                <div className={styles.resultsBox}>
                    {// Render only if hideResults is false
                    this.state.hideResults ? '' : this.renderResultItems()}
                </div>
            </div>
        )
    }
}

export default Results
