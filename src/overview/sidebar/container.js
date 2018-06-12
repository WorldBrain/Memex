import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Sidebar, { Annotation } from 'src/sidebar-overlay/components/'
import * as selectors from './selectors'
import * as actions from './actions'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool.isRequired,
        setShowSidebar: PropTypes.func.isRequired,
        annotations: PropTypes.array.isRequired,
        toggleMouseOnSidebar: PropTypes.func.isRequired,
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    updateAnnotation = () => console.log('Updated annotation')

    deleteAnnotation = () => console.log('Deleted Annotation')

    openAnnotationURL = url => () =>
        browser.tabs.create({
            active: true,
            url,
        })

    saveComment = ({ comment, tags }) => {
        const annotation = {
            highlight: null,
            body: comment,
            tags,
            timestamp: new Date(),
        }
        console.log(annotation)
    }

    renderAnnotations = () => {
        return this.props.annotations.map((annotation, i) => (
            <Annotation
                annotation={annotation}
                key={i}
                deleteAnnotation={this.deleteAnnotation}
                updateAnnotation={this.updateAnnotation}
                openAnnotationURL={this.openAnnotationURL}
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
                    saveComment={this.saveComment}
                    toggleMouseOnSidebar={this.props.toggleMouseOnSidebar}
                    env={'overview'}
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
    toggleMouseOnSidebar: event => dispatch(actions.toggleMouseOnSidebar()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
