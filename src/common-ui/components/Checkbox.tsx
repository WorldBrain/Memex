import * as React from 'react'
import cx from 'classnames'

const styles = require('./Checkbox.css')

export type CheckboxToggle = (
    event: React.SyntheticEvent<HTMLInputElement>,
) => void

export interface Props {
    id: string
    handleChange: CheckboxToggle
    name?: string
    isChecked: boolean
    isDisabled?: boolean
    containerClass?: string
    textClass?: string
    inputClass?: string
    labelClass?: string
}

class Checkbox extends React.PureComponent<Props> {
    render() {
        return (
            <div className={cx(styles.container, this.props.containerClass)}>
                <label
                    className={cx(styles.label, this.props.labelClass)}
                    htmlFor={this.props.id}
                >
                    <input
                        className={cx(
                            styles.label__checkbox,
                            this.props.inputClass,
                        )}
                        type="checkbox"
                        checked={this.props.isChecked}
                        onChange={this.props.handleChange}
                        id={this.props.id}
                        disabled={this.props.isDisabled}
                        name={this.props.name}
                    />
                    <span
                        className={cx(styles.label__text, this.props.textClass)}
                    >
                        <span className={styles.label__check}>
                            <span
                                className={cx(styles.icon, {
                                    [styles.checkedIcon]:
                                        this.props.isChecked === true,
                                })}
                            />
                        </span>
                        {this.props.children}
                    </span>
                </label>
            </div>
        )
    }
}

export default Checkbox
