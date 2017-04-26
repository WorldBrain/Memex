import React, { PropTypes } from 'react'

import styles from './Blacklist.css'

const BlacklistTable = ({ children }) => (
    <div>
        <div className={styles.toolbar} />
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.domainCell}>Domain / Expression</th>
                    </tr>
                </thead>

                <tbody>
                    {children}
                </tbody>
            </table>
        </div>
    </div>
)

BlacklistTable.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
}

export default BlacklistTable
