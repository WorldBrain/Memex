import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { selectors, actions } from '../redux'
import Sidebar from './Sidebar'
import Annotation from './AnnotationContainer'

class SidebarContainer extends React.Component {
    static propTypes = {
        showSidebar: PropTypes.bool,
        setShowSidebar: PropTypes.func,
        toggleMouseOnSidebar: PropTypes.func,
        env: PropTypes.string,
        pageUrl: PropTypes.string,
        annotations: PropTypes.array.isRequired,
        fetchAnnotations: PropTypes.func.isRequired,
        saveComment: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
    }

    static defaultProps = {
        showSidebar: true,
        setShowSidebar: () => null,
        toggleMouseOnSidebar: () => null,
        env: 'iframe',
        pageUrl: null,
    }

    async componentDidMount() {
        await this.props.fetchAnnotations(this.props.pageUrl)
    }

    handleStateChange = ({ isOpen }) => {
        if (!isOpen) this.props.setShowSidebar(false)
    }

    renderAnnotations = () => {
        const annotations = this.props.annotations.sort(
            (x, y) => x.createdWhen > y.createdWhen,
        )
        console.log(annotations)
        return annotations.map((annotation, index) => (
            <Annotation
                annotation={annotation}
                openAnnotationURL={url => () => console.log(url)}
                editAnnotation={this.props.editAnnotation}
                deleteAnnotation={this.props.deleteAnnotation}
                key={index}
            />
        ))
    }

    render() {
        console.log(this.props)
        return (
            <Sidebar
                showSidebar={this.props.showSidebar}
                handleStateChange={this.handleStateChange}
                toggleMouseOnSidebar={this.props.toggleMouseOnSidebar}
                renderAnnotations={this.renderAnnotations}
                env={this.props.env}
                saveComment={this.props.saveComment(this.props.pageUrl)}
            />
        )
    }
}

const mapStateToProps = state => ({
    annotations: selectors.annotations(state),
})

const mapDispatchToProps = dispatch => ({
    fetchAnnotations: pageUrl => dispatch(actions.fetchAnnotationAct(pageUrl)),
    saveComment: pageUrl => comment =>
        dispatch(actions.saveComment(pageUrl, comment)),
    editAnnotation: pageUrl => (url, comment) =>
        dispatch(actions.editAnnotation(pageUrl, url, comment)),
    deleteAnnotation: pageUrl => url =>
        dispatch(actions.deleteAnnotation(pageUrl, url)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
