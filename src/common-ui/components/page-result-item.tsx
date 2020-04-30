import React, { PureComponent } from 'react'
import cx from 'classnames'

import ResultItemActions from './result-item-actions'
import { Props } from './result-item'

const styles = require('./result-item.css')

class PageResultItem extends PureComponent<Props> {
    static defaultProps = {
        nullImg: '/img/null-icon.png',
    }

    // private renderScreenshot() {
    //     if (!this.props.isOverview || !this.props.areScreenshotsEnabled) {
    //         return null
    //     }

    //     return (
    //         <div className={styles.screenshotContainer}>
    //             {this.props.screenshot == null ? (
    //                 <ButtonTooltip
    //                     position="CenterCenter"
    //                     tooltipText="Screenshots are not captured when importing, or when you switch away from a tab too quickly."
    //                 >
    //                     <img
    //                         className={styles.screenshot}
    //                         src={this.props.nullImg}
    //                     />
    //                 </ButtonTooltip>
    //             ) : (
    //                 <img
    //                     className={styles.screenshot}
    //                     src={this.props.screenshot}
    //                 />
    //             )}
    //         </div>
    //     )
    // }

    render() {
        return (
            <React.Fragment>
                <div
                    className={cx(styles.infoContainer, {
                        [styles.infoContainerOverview]: this.props.isOverview,
                    })}
                >
                    <div className={styles.firstlineContainer}>
                        <div className={styles.titleContainer}>
                            <div className={styles.favIconContainer}>
                                {this.props.favIcon ? (
                                    <img
                                        className={styles.favIcon}
                                        src={this.props.favIcon}
                                    />
                                ) : (
                                    <div className={styles.noFavicon}>{''}</div>
                                )}
                            </div>
                            <div
                                title={this.props.title}
                                className={styles.title}
                            >
                                {this.props.title}
                            </div>
                        </div>
                        <div className={styles.actionItems}>
                            <ResultItemActions {...this.props} />
                        </div>
                    </div>
                    <div title={this.props.url} className={styles.url}>
                        {this.props.url}
                    </div>
                    <div className={styles.bottomLine}>
                        <div className={styles.detailsBox}>
                            <div className={styles.displayTime}>
                                {' '}
                                {this.props.displayTime}
                            </div>
                        </div>
                    </div>
                    {this.props.tags.length > 0 ? this.props.tagHolder : null}
                </div>
            </React.Fragment>
        )
    }
}

export default PageResultItem
