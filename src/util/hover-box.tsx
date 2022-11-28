import React from 'react'
import { usePopper } from 'react-popper'

export interface Props {
    referenceEl: HTMLElement
}

export const NewHoverBox: React.FC<Props> = ({ referenceEl, children }) => {
    const popperElRef = React.createRef<HTMLDivElement>()
    const { styles, attributes } = usePopper(referenceEl, popperElRef.current)

    return (
        <div ref={popperElRef} style={styles.popper} {...attributes.popper}>
            {children}
        </div>
    )
}
