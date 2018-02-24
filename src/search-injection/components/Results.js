import React from 'react'
import PropTypes from 'prop-types'

import { MEMEX_CONTAINER_ID } from '../constants'
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

    renderResultItems() {
        console.log(this.props.results)
        const resultItems = this.props.results.map((result, i) => (
            <ResultItem key={i} {...result} />
        ))
        return resultItems
    }

    render() {
        return (
            <div id={MEMEX_CONTAINER_ID} style={styles.memexResults}>
                <p>Similar results from your Memex</p>
                <div>{this.renderResultItems()}</div>
            </div>
        )
    }
}

export default Results
