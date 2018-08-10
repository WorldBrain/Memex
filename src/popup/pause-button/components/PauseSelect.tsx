import React, { SyntheticEvent, HTMLProps } from 'react'

import { Wrapper } from '../../../common-ui/components'
import { Props as ContainerProps } from './PauseContainer'

const styles = require('./PauseButton.css')

export interface Props
    extends Pick<ContainerProps, 'pauseTime' | 'onTimeChange'>,
        HTMLProps<HTMLSelectElement> {
    children: React.ReactChild[]
}

export default function PauseSelect({
    onTimeChange,
    pauseTime,
    children,
    onClick = (e: SyntheticEvent) => e.stopPropagation(),
}: Props) {
    return (
        <Wrapper>
            Pause indexing for
            <select
                className={styles.dropdown}
                value={pauseTime}
                onChange={onTimeChange}
                onClick={onClick}
            >
                {children}
            </select>
            mins
        </Wrapper>
    )
}
