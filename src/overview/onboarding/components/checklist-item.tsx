import React, { PureComponent } from 'react'
import { Checkbox } from '../../../common-ui/components'

const styles = require('./checklist.css')

interface Props {
    isChecked: boolean
    id: string
    children: React.ReactChild
    handleClick: () => void
}

export default class ChecklistItem extends PureComponent<Props> {
    render() {
        return (
            <div className={styles.checklist}>
                <Checkbox
                    isChecked={this.props.isChecked}
                    handleChange={() => null}
                    id={this.props.id}
                >
                    {' '}
                    <span
                        className={styles.checklistText}
                        onClick={this.props.handleClick}
                    >
                        {this.props.children}{' '}
                    </span>
                </Checkbox>
            </div>
        )
    }
}
