import React from 'react'
import { connect } from 'react-redux'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'
import LoadingIndicator from './LoadingIndicator'


class Overview extends React.Component {
    render() {
        return  <div>
                <input
                  className={styles.query}
                  onChange={e=>this.props.onInputChanged(e.target.value)}
                  placeholder="Search your memory"
                  value={this.props.query}
                  ref='inputQuery'
               >
               </input>
               <div>
                  <DatePicker
                    placeholderText="select startdate"
                    selected={this.props.startDate }
                    minDate={moment().subtract(365,"days")}
                    maxDate={moment()}
                    onChange={e=>this.props.onStartDateChange(e)}
                />
                  <DatePicker
                    placeholderText="select startdate"
                    selected={this.props.endDate}
                    minDate={moment().subtract(365,"days")}
                    maxDate={moment()}
                    onChange={e=>this.props.onEndDateChange(e)}
                  />
                </div> 
                {this.props.waitingForResults
                ? <LoadingIndicator />
                : <ResultList searchResult={this.props.searchResult} searchQuery={this.props.query} />
            }
               </div>         
        
    }

    componentDidMount() {
        if (this.props.grabFocusOnMount) {
            this.refs['inputQuery'].focus()
        }
    }
}

const mapStateToProps = (state) => ({
    query: ourState(state).query,
    searchResult: ourState(state).searchResult,
    waitingForResults: ourState(state).waitingForResults,
    startDate: ourState(state).startDate,
    endDate:  ourState(state).endDate
})

const mapDispatchToProps = (dispatch) => ({
    onInputChanged: input => {
        dispatch(actions.setQuery({query: input}))
    },
    onStartDateChange: date => {
             dispatch(actions.handleStartChange({startDate: date}))
      },

    onEndDateChange: date => {
             dispatch(actions.handleEndChange({endDate: date}))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
