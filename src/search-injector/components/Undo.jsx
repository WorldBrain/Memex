import React from 'react'
import PropTypes from 'prop-types'

import styles from './Undo.css'

const UndoComponent = props => (
    <button onClick={props.handleUndo} className={styles.undoContainer}>
        UNDO
    </button>
)

UndoComponent.propTypes = {
    handleUndo: PropTypes.func.isRequired,
}

export default UndoComponent
