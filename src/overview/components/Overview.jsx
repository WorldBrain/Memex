import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import * as actions from '../actions'
import * as selectors from '../selectors'
import ResultList from './ResultList'
import LoadingIndicator from './LoadingIndicator'
import DateRangeSelection from './DateRangeSelection'
import styles from './Overview.css'


class Overview extends React.Component {
    constructor(props) {
        super(props)

        this.handlePagination = this.handlePagination.bind(this)
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.inputQueryRef.focus()
        }
    }

    handlePagination() {
        const { boundActions, areMoreResults } = this.props

        if (areMoreResults) {
            boundActions.getMoreResults()
        }
    }

    render() {
        const { boundActions } = this.props

        return (
            <div>
                <div>
                    <input
                        className={styles.query}
                        onChange={e => boundActions.setQuery(e.target.value)}
                        placeholder='Search your memory'
                        value={this.props.query}
                        ref={ref => { this.inputQueryRef = ref }}
                     />
                </div>
                <DateRangeSelection
                    startDate={this.props.startDate}
                    endDate={this.props.endDate}
                    onStartDateChange={boundActions.setStartDate}
                    onEndDateChange={boundActions.setEndDate}
                />
                <div>
                    {this.props.waitingForResults
                        ? <LoadingIndicator />
                        : (
                            <ResultList
                                searchResult={this.props.searchResult}
                                searchQuery={this.props.query}
                                handlePagination={this.handlePagination}
                                isMoreLoading={this.props.isMoreLoading}
                            />
                        )
                    }
                </div>
            </div>
        )
    }
}

Overview.propTypes = {
    grabFocusOnMount: PropTypes.bool,
    query: PropTypes.string,
    startDate: PropTypes.number,
    endDate: PropTypes.number,
    boundActions: PropTypes.object.isRequired,
    waitingForResults: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    isMoreLoading: PropTypes.bool.isRequired,
    areMoreResults: PropTypes.bool.isRequired,
    searchResult: PropTypes.object,
}


const mapStateToProps = state => ({
    ...selectors.ourState(state),
    isMoreLoading: selectors.isMoreLoading(state),
    areMoreResults: selectors.areMoreResults(state),
})

const mapDispatchToProps = dispatch => ({ boundActions: bindActionCreators(actions, dispatch) })

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
