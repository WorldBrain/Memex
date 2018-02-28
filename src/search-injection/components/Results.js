import React from 'react'
import PropTypes from 'prop-types'

import ResultItem from './ResultItem'
import { MEMEX_CONTAINER_ID, OVERVIEW_URL, LOCALSTORAGE_ID } from '../constants'

const styles = {
    memexResults: {
        marginBottom: 30,
    },
    toggle: {
        cursor: 'pointer',
        fontSize: 13,
        color: '#4abf9d',
        float: 'right',
    },
}

class Results extends React.Component {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            hideResults: false,
        }
        this.showMoreHandler = this.showMoreHandler.bind(this)
        this.toggleHideResults = this.toggleHideResults.bind(this)
    }

    componentDidMount() {
        const stored = localStorage.getItem(LOCALSTORAGE_ID)
        const hideResults = stored === 'true'
        this.setState({
            hideResults,
        })
    }

    renderResultItems() {
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem key={i} {...result} />
        ))
        return (
            <div className="memex-results">
                <div>{resultItems}</div>
                <a href="#" onClick={this.showMoreHandler}>
                    Show more results
                </a>
            </div>
        )
    }

    showMoreHandler() {
        // Create a new tab with the query overview URL
        const query = new URL(location.href).searchParams.get('q')
        const url = `${OVERVIEW_URL}?query=${query}`
        const message = {
            action: 'openOverviewURL',
            url,
        }
        browser.runtime.sendMessage(message)
    }

    toggleHideResults() {
        // Toggles the hideResults state
        // Also updates the localstorage
        const newState = !this.state.hideResults
        localStorage.setItem(LOCALSTORAGE_ID, newState)
        this.setState({
            hideResults: newState,
        })
    }

    render() {
        // Number of search results
        const len = this.props.results.length
        return (
            <div id={MEMEX_CONTAINER_ID} style={styles.memexResults}>
                <p>
                    You got {len} results in your Memex memory.
                    <span
                        style={styles.toggle}
                        onClick={this.toggleHideResults}
                    >
                        {this.state.hideResults ? 'show' : 'close'}
                    </span>
                </p>
                {// Render only if hideResults is false
                this.state.hideResults ? '' : this.renderResultItems()}
            </div>
        )
    }
}

export default Results
