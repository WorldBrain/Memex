import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Input } from 'semantic-ui-react'

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
                <div
                    className={styles.queryInputContainer}
                >
                    <Input
                        size='huge'
                        icon='search'
                        iconPosition='left'
                        onChange={e => { this.props.onInputChanged(e.target.value) }}
                        onKeyDown={e => {
                            if (e.key === 'Escape') { this.props.onInputChanged('') }
                        }}
                        placeholder='Search your memory'
                        value={this.props.query}
                        ref={el => { this.inputQueryEl = el }}
                        className={styles.queryInputComponent}
                    />
                    <DateSelection
                        date={this.props.endDate}
                        onDateChange={this.props.onEndDateChange}
                    />
                </div>
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

const mapDispatchToProps = dispatch => bindActionCreators({
    onInputChanged: actions.setQuery,
    onEndDateChange: actions.setEndDate,
    onBottomReached: actions.loadMoreResults,
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
