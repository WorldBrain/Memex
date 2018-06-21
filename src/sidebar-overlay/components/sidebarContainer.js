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
        this.props.annotations.map((annotation, key) => (
            <Annotation
                annotation={annotation}
                openAnnotationURL={url => () => console.log(url)}
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
            />
        )
    }
}

const mapStateToProps = state => ({
    annotations: selectors.annotations(state),
})

const mapDispatchToProps = dispatch => ({
    fetchAnnotations: pageUrl => dispatch(actions.fetchAnnotationAct(pageUrl)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(SidebarContainer)
