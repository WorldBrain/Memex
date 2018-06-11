import React from 'react'
import Sidebar, { Annotation } from './components'

class SidebarContainer extends React.Component {
    saveComment = () => console.log('Saving Comment')

    renderAnnotations = () => {
        const annotation = {
            highlight: 'This is an highlight',
            body: 'Nothing.',
            url: 'https://google.com',
            tags: ['Sup', 'Dup'],
            timestamp: new Date().getTime(),
        }
        return (
            <Annotation
                annotation={annotation}
                openAnnotationURL={url => () => console.log(url)}
            />
        )
    }

    render() {
        return (
            <Sidebar
                showSidebar
                saveComment={this.saveComment}
                renderAnnotations={this.renderAnnotations}
            />
        )
    }
}

export default SidebarContainer
