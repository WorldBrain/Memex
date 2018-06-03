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

    componentDidMount() {
        document.addEventListener('scroll', this.preventParentScroll)
    }

    componentWillUnmount() {
        document.removeEventListener('scroll', this.preventParentScroll)
    }

    preventParentScroll = event => {
        if (this.props.showSidebar) window.scrollTo(0, 0)
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
