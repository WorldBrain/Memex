import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import LoadingIndicator from 'src/overview/components/LoadingIndicator'
import styles from '../../options.css'
import localStyles from './styles.css'


class ImportComponent extends Component {
    constructor(props) {
        super();
        this.state = {
            allowImport: {
                history: true,
                bookmarks: false,
            }
        };
    }
    
    onAllowImportHistoryClick = () => {
        this.setState((state) => {
            let newState = Object.assign({}, state);
            newState.allowImport.history = !state.allowImport.history;
            return newState;
        })
    }
    
    onAllowImportBookmarksClick = () => {
        this.setState((state) => {
            let newState = Object.assign({}, state);
            newState.allowImport.bookmarks = !state.allowImport.bookmarks;
            return newState;
        })
    }
    
    render() {
        const { loadingStatus, searchIndexRebuildingStatus, startLoading, pauseLoading, resumeLoading, historyStats, bookmarksStats } = this.props;
        const isLoading = loadingStatus == 'pending' || searchIndexRebuildingStatus == 'pending'
        const isPaused = loadingStatus == 'paused'
      
        return (
            <div>
                <h1 className={styles.routeTitle}>Analyse History & Bookmarks</h1>
                <table className={localStyles.importTable}>
                    <thead className={localStyles.importTableHead}>
                        <tr className={localStyles.importTableRow}>
                            <td></td>
                            <td>Browsing History</td>
                            <td>Bookmarks</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className={localStyles.importTableRow}>
                            <td>Pages already saved</td>
                            <td>{historyStats.saved}</td>
                            <td>{bookmarksStats.saved}</td>
                        </tr>
                        <tr className={classNames(localStyles.importTableRow, localStyles.importTableRowSepar)}>
                            <td>~ Size on Hard Drive</td>
                            <td>{historyStats.sizeEngaged} MB</td>
                            <td>{bookmarksStats.sizeEngaged} MB</td>
                        </tr>

                        <tr className={localStyles.importTableRow}>
                            <td>Not yet downloaded</td>
                            <td>{historyStats.notDownloaded}</td>
                            <td>{bookmarksStats.notDownloaded}</td>
                        </tr>
                        <tr className={localStyles.importTableRow}>
                            <td>~ Size on Hard Drive</td>
                            <td>{historyStats.sizeRequired} MB</td>
                            <td>{bookmarksStats.sizeRequired} MB</td>
                        </tr>
                        <tr className={localStyles.importTableRow}>
                            <td>~ Time to downlaod</td>
                            <td>{Math.floor(historyStats.timeEstim/60)}:{historyStats.timeEstim - Math.floor(historyStats.timeEstim/60)*60} h</td>
                            <td>{Math.floor(bookmarksStats.timeEstim/60)}:{bookmarksStats.timeEstim - Math.floor(bookmarksStats.timeEstim/60)*60} h</td>
                        </tr>
                        <tr className={classNames(localStyles.importTableRow, localStyles.actionTableRow)}>
                            <td>Import?</td>
                            <td><input type="checkbox" name="history" onChange={this.onAllowImportHistoryClick} checked={this.state.allowImport.history} /></td>
                            <td><input type="checkbox" name="bookmarks" onChange={this.onAllowImportBookmarksClick} checked={this.state.allowImport.bookmarks} /></td>
                        </tr>
                    </tbody>
                </table>
                
                <div className={styles.fluidContainer}>
                    {!isLoading && (isPaused ?
                    <button
                        className={classNames(localStyles.actionButton, styles.button)}
                        onClick={(evt) => resumeLoading(evt, this.state.allowImport)}
                        disabled={!this.state.allowImport.history && !this.state.allowImport.bookmarks}
                    >Resume</button> :
                    <button
                        className={classNames(localStyles.actionButton, styles.button)}
                        onClick={(evt) => startLoading(evt, this.state.allowImport)}
                        disabled={!this.state.allowImport.history && !this.state.allowImport.bookmarks}
                    >Start Import</button>)}
                        
                    {isLoading &&
                    <button
                        className={classNames(localStyles.actionButton, styles.button)}
                        onClick={pauseLoading}
                    >Pause</button>}
                            
                    {isPaused && <span className={styles.helpText}>Loading was paused</span>}
                </div>
                
                <div className={styles.fluidContainer}>
                    <span className={classNames(styles.helpText, styles.helpText_right)}>
                        Downloading may slow down your browsing experience.<br /> You can pause and resume anytime
                    </span>
                </div>
            </div>
        )
    }
}

const { string, func, shape, number } = PropTypes;

ImportComponent.propTypes = {
    loadingStatus: string,
    searchIndexRebuildingStatus: string,
    startLoading: func.isRequired,
    pauseLoading: func.isRequired,
    resumeLoading: func.isRequired,
    historyStats: shape({ // recieve statistics as props from container
        saved: number,
        sizeEngaged: number,
        notDownloaded: number,
        sizeRequired: number,
        timeEstim: number
    }),
    bookmarksStats: shape({ // recieve statistics as props from container
        saved: number,
        sizeEngaged: number,
        notDownloaded: number,
        sizeRequired: number,
        timeEstim: number
    })
}

ImportComponent.defaultProps = {
    loadingStatus: null,
    searchIndexRebuildingStatus: null,
    historyStats: {
        saved: 0,
        sizeEngaged: 0,
        notDownloaded: 0,
        sizeRequired: 0,
        timeEstim: 0 // time estimation to download, in minutes
    },
    bookmarksStats: {
        saved: 0,
        sizeEngaged: 0,
        notDownloaded: 0,
        sizeRequired: 0,
        timeEstim: 0 // time estimation to download, in minutes
    }
}

export default ImportComponent
