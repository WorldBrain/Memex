import React from 'react'
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
    <div onClick={handleRenderCreateList}>
        {isForInpage ? <div>Collections</div> : null}
        <div>
            <span />
            <span>Add New </span>
        </div>
    </div>
)

export default List
