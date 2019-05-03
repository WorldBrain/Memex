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
import Link from './link'

const styles = require('./result-item.css')

class SocialResultItem extends PureComponent<Props> {
    get hrefToUser() {
        return `http://twitter.com/${this.props.user.username}`
    }

    private renderText() {
        const text = this.props.text

        let replacedText
        replacedText = reactStringReplace(text, URL_PATTERN, (match, i) => (
            <Link
                key={match + i}
                url={match.startsWith('http') ? match : 'https://' + match}
            />
        ))

        // Match @-mentions
        replacedText = reactStringReplace(
            replacedText,
            /@(\w+)/g,
            (match, i) => (
                <Link
                    key={match + i}
                    url={`https://twitter.com/${match}`}
                    text={`@${match}`}
                />
            ),
        )

        // Match hashtags
        replacedText = reactStringReplace(
            replacedText,
            /#(\w+)/g,
            (match, i) => (
                <Link
                    key={match + i}
                    url={`https://twitter.com/hashtag/${match}`}
                    text={`#${match}`}
                />
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
                        <div className={styles.fullNameGroup}>
                            <div className={styles.fullName}>
                                {this.props.user.name}  
                                {this.props.user.isVerified && (
                                    <span className={styles.verified}>
                                        <span className={styles.hiddenVisually}>
                                            Verified account
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div className={styles.username}>
                                @<b>{this.props.user.username}</b>
                            </div>
                        </div>
                    </a>
                    <div className={styles.twitterLogo}/>
                </div>
                <div className={styles.tweetContent}>
                    {this.renderText()}
                    {this.props.createdAt && (
                        <span className={styles.timeStamp}>
                            {moment(this.props.createdAt).format(
                                TWEET_DATE_FORMAT,
                            )}
                        </span>
                    )}
                </div>
                <div className={styles.footer}>
                    <div className={styles.topRow}>
                        <div className={styles.url}>
                            {this.props.url}
                        </div>
                        <div className={styles.close}>
                            {this.props.isListFilterActive && (
                                <SemiCircularRibbon
                                    onClick={this.props.handleCrossRibbonClick}
                                />
                            )}
                        </div>
                    </div>
                    <div className={styles.bottomRow}>
                        {!this.props.isOverview && this.props.tagHolder}
                        <ResultItemActions {...this.props} />
                    </div>
                </div>
            </div>
        )
    }
}

export default SocialResultItem
