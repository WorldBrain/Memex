import React from 'react'
import PropTypes from 'prop-types'

import styles from './BlacklistTable.css'

const renderStoreMsg = isStoring => {
    if (isStoring === 1) return <div>storing index...</div>
    if (isStoring === 2) return <div>restoring index...</div>
    return null
}

const BlacklistTable = ({
    children, searchVal, onSearchChange, onSingleSearchClick, onStoreClick,
    onMultiSearchClick, results, onSearchSizeClick, onStreamSearchClick, isStoring,
    onRestoreClick, onDestroyClick,
}) => (
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
        <div>
            <label htmlFor='test-search'>search-index</label>
            <input
                id='test-search'
                type='text'
                value={searchVal}
                onChange={onSearchChange}
            />
            <button onClick={onSingleSearchClick}>Find one</button>
            <button onClick={onMultiSearchClick}>Find many</button>
            <button onClick={onStreamSearchClick}>Find streamed</button>
            <button onClick={onSearchSizeClick}>Check index size</button>
            <button onClick={onStoreClick}>Store index to storage</button>
            <button onClick={onRestoreClick}>Restore index from storage</button>
            <button onClick={onDestroyClick}>Destroy index</button>
            {renderStoreMsg(isStoring)}
            <ul>
                {results.map((res, i) => (
                    <li key={i}>
                        <p>{JSON.stringify(res, null, '\t')}</p>
                    </li>
                ))}
            </ul>
        </div>
    </div>
)

BlacklistTable.propTypes = {
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
    onSearchChange: PropTypes.func.isRequired,
    onSingleSearchClick: PropTypes.func.isRequired,
    onMultiSearchClick: PropTypes.func.isRequired,
    onSearchSizeClick: PropTypes.func.isRequired,
    onStreamSearchClick: PropTypes.func.isRequired,
    onStoreClick: PropTypes.func.isRequired,
    onRestoreClick: PropTypes.func.isRequired,
    onDestroyClick: PropTypes.func.isRequired,
    isStoring: PropTypes.number.isRequired,
    searchVal: PropTypes.string.isRequired,
    results: PropTypes.array.isRequired,
}

export default BlacklistTable
