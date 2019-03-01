import React, { PureComponent } from 'react'
import cx from 'classnames'

const styles = require('./checklist-item.css')

interface Props {
    isChecked: boolean
    subtitle: string
    children: React.ReactChild
    handleClick: () => void
}

export default class ChecklistItem extends PureComponent<Props> {
    render() {
        return (
            <React.Fragment>
                <div className={styles.checklist}>
                    <div
                        className={cx(styles.icon, {
                            [styles.doneIcon]: this.props.isChecked,
                        })}
                        onClick={this.props.handleClick}
                    />
                    <div>
                    <p
                        className={cx(styles.checklistText, {
                            [styles.striked]: this.props.isChecked,
                        })}
                        onClick={this.props.handleClick}
                    >
                        {this.props.children}{' '}
                    </p>
                    <p
                        className={cx(styles.subTitle, {
                            [styles.striked]: this.props.isChecked,
                        })}
                        onClick={this.props.handleClick}
                    >
                        {this.props.subtitle}
                    </p>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}
