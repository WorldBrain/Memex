import React from 'react'
import styles from './Index.css'
import PropTypes from 'prop-types'
import ButtonTooltip from 'src/common-ui/components/button-tooltip'

const List = props => (
    <div className={styles.collection} onClick={props.handleRenderCreateList}>
        <ButtonTooltip
                    position="bottom"
                    tooltipText="Drag & drop pages into collections."
        >
        <span className={styles.myCollection}> My Collections </span>
        </ButtonTooltip>
         <ButtonTooltip
                    position="right"
                    tooltipText="Add new collection. Add items via Drag & Drop"
        >
        	<span className={styles.plus}/>
        </ButtonTooltip>
    </div>
)

List.propTypes = {
    handleRenderCreateList: PropTypes.func.isRequired,
}

export default List
