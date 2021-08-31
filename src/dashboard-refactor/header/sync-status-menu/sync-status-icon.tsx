import styled from 'styled-components'
import type { SyncStatusIconState } from '../types'
import styles from '../../styles'

export const SyncStatusIcon = styled.div<{
    color: SyncStatusIconState
}>`
    height: 12px;
    width: 12px;
    border-radius: 6px;
    background-color: ${(props) =>
        styles.components.syncStatusIcon.colors[props.color]};
`
