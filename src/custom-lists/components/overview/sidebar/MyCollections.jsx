import React from 'react'
import styles from './Index.css'
import PropTypes from 'prop-types'

const List = props => (
    <div className={styles.collection}>
        <span className={styles.myCollection}> My Collections </span>
        <span className={styles.plus} onClick={props.handleRenderCreateList}>
            {' '}
            +{' '}
        </span>
    </div>
)

List.propTypes = {
    handleRenderCreateList: PropTypes.func.isRequired,
}

export default List
