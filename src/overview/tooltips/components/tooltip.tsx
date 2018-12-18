import React, { SFC } from 'react'

const styles = require('tooltip.css')

export interface Props {
    children: React.ReactChild
}

const Tooltip: SFC<Props> = ({ children }) => (
    <div className={styles.container}>{children}</div>
)

export default Tooltip
