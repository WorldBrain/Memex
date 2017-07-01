import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'
import DateSelection from './DateSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryEl.focus()
        }
    }

    render() {
        return (
            <div>
                <div>
                    <input
                        className={styles.query}
                        onInput={e => { this.props.onInputChanged(e.target.value) }}
                        onKeyDown={e => {
                            if (e.key === 'Escape') { this.props.onInputChanged('') }
                        }}
                        placeholder='Search your memory'
                        value={this.props.query}
                        ref={el => { this.inputQueryEl = el }}
                    />
                </div>
                <DateSelection
                    date={this.props.endDate}
                    onDateChange={this.props.onEndDateChange}
                />
                <div>
                    <ResultList
                        searchResult={this.props.searchResult}
                        searchQuery={this.props.query}
                        onBottomReached={this.props.onBottomReached}
                        waitingForResults={this.props.waitingForResults}
                    />
                </div>
            </div>
        )
    }
}

Overview.propTypes = {
    grabFocusOnMount: PropTypes.bool,
    query: PropTypes.string,
    onInputChanged: PropTypes.func,
    endDate: PropTypes.number,
    onEndDateChange: PropTypes.func,
    onBottomReached: PropTypes.func,
    waitingForResults: PropTypes.bool,
    searchResult: PropTypes.object,
}


const mapStateToProps = state => {
    state = ourState(state)
    return {
        ...state.currentQueryParams,
        searchResult: state.searchResult,
        waitingForResults: !!state.waitingForResults, // cast to boolean
    }
}

const mapDispatchToProps = dispatch => ({
    onInputChanged: input => {
        dispatch(actions.setQuery({query: input}))
    },
    onEndDateChange: date => {
        dispatch(actions.setEndDate({endDate: date}))
    },
    onBottomReached: () => {
        dispatch(actions.loadMoreResults())
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
