import React, { PureComponent } from 'react'

const styles = require('./DragElement.css')

class DragElement extends PureComponent {
    render() {
        return (
            <div id="dragged-element" className={styles.dragElement}>
                {' '}
                + Add to Collection
            </div>
        )
    }
}

export default DragElement
