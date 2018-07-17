import React from 'react'
import styles from './Index.css'
import PropTypes from 'prop-types'

const List = props => (
    <div className={styles.collection} onClick={props.handleRenderCreateList}>
        <span className={styles.myCollection}> My Collections </span>
        <span className={styles.plus}> + </span>
    </div>
)

List.propTypes = {
    handleRenderCreateList: PropTypes.func.isRequired,
}

export default List
