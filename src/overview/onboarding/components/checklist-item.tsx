import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./checklist-item.css')

interface Props {
    isChecked: boolean
    iconClass: string
    subtitle: string
    children: React.ReactChild
    handleClick: () => void
}

export default class ChecklistItem extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <div className={styles.checklist}>
                    <span
                        className={cx(
                            styles.icon,
                            styles[this.props.iconClass],
                        )}
                    />
                    <span
                        className={cx(styles.checklistText, {
                            [styles.striked]: this.props.isChecked,
                        })}
                        onClick={this.props.handleClick}
                    >
                        {this.props.children}{' '}
                    </span>
                </div>
                <p
                    className={cx(styles.subTitle, {
                        [styles.striked]: this.props.isChecked,
                    })}
                >
                    {this.props.subtitle}
                </p>
            </React.Fragment>
        )
    }
}
