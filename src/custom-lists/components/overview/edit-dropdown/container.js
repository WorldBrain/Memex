import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
// import { bindActionCreators } from 'redux'

import Dropdown from './DropdownContainer'
import EditDropdown from './ListEditDropdown'
import { selectors } from 'src/custom-lists'

class ListEditDropdown extends Component {
    static propTypes = {
        urlsAdded: PropTypes.arrayOf(String).isRequired,
    }

    constructor(props) {
        super(props)
        this.state = {
            addToList: false,
        }
    }

    toggleAddToList = () => {
        console.log('toggle')
        this.setState({
            addToList: !this.state.addToList,
        })
    }

    handleRenderDropdown = () =>
        this.state.addToList ? <Dropdown {...this.props} /> : null

    render() {
        return (
            <EditDropdown
                toggleAddToList={this.toggleAddToList}
                urlsAdded={this.props.urlsAdded}
                handleRenderDropdown={this.handleRenderDropdown()}
                {...this.props}
            />
        )
    }
}

const mapStateToProps = state => ({
    urlsAdded: selectors.getUrlsToEdit(state),
    results: selectors.results(state),
})

export default connect(
    mapStateToProps,
    null,
)(ListEditDropdown)
