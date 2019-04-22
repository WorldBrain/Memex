import React from 'react'

import cx from 'classnames'
const styles = require('./Index.css')

import ButtonTooltip from 'src/common-ui/components/button-tooltip'

interface Props {
    handleRenderCreateList: () => void
    isForInpage?: boolean
}

/* tslint:disable-next-line variable-name */
const List = ({ handleRenderCreateList, isForInpage = false }: Props) => (
    <div
        className={cx(styles.collection, {
            [styles.collectionSidebar]: isForInpage,
        })}
        onClick={handleRenderCreateList}
    >
        <span
            className={cx(styles.myCollection, {
                [styles.myCollectionSidebar]: isForInpage,
            })}
        >
            Collections{' '}
        </span>
        <ButtonTooltip
            position="right"
            tooltipText="Add new collection. Add items via Drag & Drop"
        >
            <span className={styles.plus} />
        </ButtonTooltip>
    </div>
)

export default List
