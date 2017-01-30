import React from 'react'
import { connect } from 'react-redux'

import * as actions from '../actions'
import { ourState } from '../selectors'
import ResultList from './ResultList'

class Overview extends React.Component {
    render() {
        return <div className="Overview">
            <input
                className='query'
                onChange={e=>this.props.onInputChanged(e.target.value)}
                placeholder="Search your memory"
                value={this.props.query}
                ref='inputQuery'
            >
            </input>
            <ResultList searchResult={this.props.searchResult} />
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
})

const mapDispatchToProps = (dispatch) => ({
    onInputChanged: input => {
        dispatch(actions.setQuery({query: input}))
    },
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
