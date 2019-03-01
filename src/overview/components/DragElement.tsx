import React, { PureComponent } from 'react'

const styles = require('./DragElement.css')

class DragElement extends PureComponent {
    render() {
        return (
            <div id="dragged-element" className={styles.dragElement}>
                {' '}
                + Drop into Collection
            </div>
        )
    }
}

export default DragElement
