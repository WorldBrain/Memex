import React, { PureComponent } from 'react'
import { Props } from './result-item'
import moment from 'moment'
import reactStringReplace from 'react-string-replace'
import ResultItemActions from './result-item-actions'
import SemiCircularRibbon from './semi-circular-ribbon'
import {
    URL_PATTERN,
    TWEET_DATE_FORMAT,
} from 'src/social-integration/constants'

const styles = require('./result-item.css')

class SocialResultItem extends PureComponent<Props> {
    get hrefToUser() {
        return `http://twitter.com/${this.props.user.username}`
    }

    private renderText() {
        const text = this.props.text

        let replacedText
        replacedText = reactStringReplace(text, URL_PATTERN, (match, i) => (
            <a
                key={match + i}
                href={match.startsWith('http') ? match : 'https://' + match}
                target="_blank"
            >
                {match}
            </a>
        ))

        // Match @-mentions
        replacedText = reactStringReplace(
            replacedText,
            /@(\w+)/g,
            (match, i) => (
                <a
                    key={match + i}
                    href={`https://twitter.com/${match}`}
                    target="_blank"
                >
                    @{match}
                </a>
            ),
        )

        // Match hashtags
        replacedText = reactStringReplace(
            replacedText,
            /#(\w+)/g,
            (match, i) => (
                <a
                    key={match + i}
                    href={`https://twitter.com/hashtag/${match}`}
                    target="_blank"
                >
                    #{match}
                </a>
            ),
        )

        return <p className={styles.tweetText}>{replacedText}</p>
    }

    render() {
        return (
            <div className={styles.tweetInfoContainer}>
                <div className={styles.header}>
                    <a
                        className={styles.accountGroup}
                        href={this.hrefToUser}
                        target="_blank"
                    >
                        {this.props.user.profilePic && (
                            <img
                                className={styles.avatar}
                                src={this.props.user.profilePic as string}
                            />
                        )}
                        <span className={styles.fullNameGroup}>
                            <strong className={styles.fullName}>
                                {this.props.user.name}
                            </strong>
                            <span>‏&nbsp;</span>
                            {this.props.user.isVerified && (
                                <span className={styles.verified}>
                                    <span className={styles.hiddenVisually}>
                                        Verified account
                                    </span>
                                </span>
                            )}
                            <span>‏&nbsp;</span>
                        </span>
                        <span className={styles.username}>
                            @<b>{this.props.user.username}</b>
                        </span>
                    </a>
                </div>
                <div>
                    {this.renderText()}
                    {this.props.createdAt && (
                        <span className={styles.timeStamp}>
                            {moment(this.props.createdAt).format(
                                TWEET_DATE_FORMAT,
                            )}
                        </span>
                    )}
                </div>
                <div className={styles.closeContainer}>
                    <div className={styles.url}>{this.props.url}</div>
                    {this.props.isListFilterActive && (
                        <SemiCircularRibbon
                            onClick={this.props.handleCrossRibbonClick}
                        />
                    )}
                </div>
                {!this.props.isOverview && this.props.tagHolder}
                <ResultItemActions {...this.props} />
            </div>
        )
    }
}

export default SocialResultItem
