import React from 'react'
import PropTypes from 'prop-types'

import { MEMEX_CONTAINER_ID, OVERVIEW_URL } from '../constants'
import ResultItem from './ResultItem'

const styles = {
    memexResults: {
        marginBottom: 30,
    },
}

class Results extends React.Component {
    static propTypes = {
        results: PropTypes.arrayOf(PropTypes.object).isRequired,
    }

    constructor(props) {
        super(props)
        this.showMoreHandler = this.showMoreHandler.bind(this)
    }

    renderResultItems() {
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem key={i} {...result} />
        ))
        return resultItems
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

    render() {
        return (
            <div id={MEMEX_CONTAINER_ID} style={styles.memexResults}>
                <p>Similar results from your Memex</p>
                <div>{this.renderResultItems()}</div>
                <a href="#" onClick={this.showMoreHandler}>
                    Show more results
                </a>
            </div>
        )
    }
}

export default Results
