import React from 'react'

import cx from 'classnames'
const styles = require('./Index.css')

interface Props {
    handleRenderCreateList: () => void
    isForInpage?: boolean
    isSidebarLocked?: boolean
}

/* tslint:disable-next-line variable-name */
const List = ({
    handleRenderCreateList,
    isForInpage = false,
    isSidebarLocked,
}: Props) => (
    <div
        className={cx(styles.collection, {
            [styles.collectionSidebar]: isForInpage,
        })}
        onClick={handleRenderCreateList}
    >
        {isForInpage ? (
            <div className={styles.collectionSidebarTitle}>Collections</div>
        ) : null}
        <div
            className={cx(styles.addNew, {
                [styles.addNewHover]: isSidebarLocked,
            })}
        >
            <span className={styles.plus} />
            <span
                className={cx(styles.myCollection, {
                    [styles.myCollectionSidebar]: isForInpage,
                })}
            >
                Add New{' '}
            </span>
        </div>
    </div>
)

export default List
