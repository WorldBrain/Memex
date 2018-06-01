import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Sidebar from './components/Sidebar'
import Annotation from './components/Annotation'
import * as selectors from './selectors'
import * as actions from './actions'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool.isRequired,
        setShowSidebar: PropTypes.func.isRequired,
        annotations: PropTypes.array.isRequired,
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    updateAnnotation = () => console.log('Updated annotation')

    deleteAnnotation = () => console.log('Deleted Annotation')

    renderAnnotations = () => {
        return this.props.annotations.map((annotation, i) => (
            <Annotation
                annotation={annotation}
                key={i}
                deleteFn={this.deleteAnnotation}
                updateFn={this.updateAnnotation}
            />
        ))
    }

    render() {
        return (
            <div>
                <Sidebar
                    showSidebar={this.props.showSidebar}
                    renderAnnotations={this.renderAnnotations}
                    handleStateChange={this.handleStateChange}
                />
            </div>
        )
    }
}

const mapStateToProps = state => ({
    showSidebar: selectors.showSidebar(state),
    annotations: selectors.annotations(state),
})

const mapDispatchToProps = dispatch => ({
    setShowSidebar: showSidebar =>
        dispatch(actions.setShowSidebar(showSidebar)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
