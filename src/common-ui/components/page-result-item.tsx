import React, { PureComponent } from 'react'
import cx from 'classnames'

import SemiCircularRibbon from './semi-circular-ribbon'
import ButtonTooltip from './button-tooltip'
import ResultItemActions from './result-item-actions'
import { Props } from './result-item'

const styles = require('./result-item.css')

class PageResultItem extends PureComponent<Props> {
    static defaultProps = {
        nullImg: '/img/null-icon.png',
    }

    private renderScreenshot() {
        if (!this.props.isOverview || !this.props.areScreenshotsEnabled) {
            return null
        }

        return (
            <div className={styles.screenshotContainer}>
                {this.props.screenshot == null ? (
                    <ButtonTooltip
                        position="CenterCenter"
                        tooltipText="Screenshots are not captured when importing, or when you switch away from a tab too quickly."
                    >
                        <img
                            className={styles.screenshot}
                            src={this.props.nullImg}
                        />
                    </ButtonTooltip>
                ) : (
                    <img
                        className={styles.screenshot}
                        src={this.props.screenshot}
                    />
                )}
            </div>
        )
    }

    render() {
        return (
            <React.Fragment>
                {this.renderScreenshot()}
                <div
                    className={cx(styles.infoContainer, {
                        [styles.infoContainerOverview]: this.props.isOverview,
                    })}
                >
                    <div className={styles.firstlineContainer}>
                        <div className={styles.title} title={this.props.title}>
                            {this.props.favIcon && (
                                <img
                                    className={styles.favIcon}
                                    src={this.props.favIcon}
                                />
                            )}
                            <span className={styles.titleText}>
                                {this.props.title}
                            </span>
                        </div>
                        {this.props.isListFilterActive && (
                            <SemiCircularRibbon
                                onClick={this.props.handleCrossRibbonClick}
                            />
                        )}
                    </div>
                    <div className={styles.url}>{this.props.url}</div>
                    {!this.props.isOverview && this.props.tagHolder}
                    <ResultItemActions {...this.props} />
                </div>
            </React.Fragment>
        )
    }
}

export default PageResultItem
