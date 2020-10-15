import React, { PureComponent } from 'react'

import OutLink from 'src/common-ui/containers/OutLink'
import Button from './Button'

const styles = require('./Button.css')
const LinkButtonStyles = require('src/popup/collections-button/components/CollectionsButton.css')

interface Props {
    goToDashboard: () => void
}

class LinkButton extends PureComponent<Props> {
    render() {
        return (
            <div className={LinkButtonStyles.buttonContainer}>
                <Button
                    onClick={this.props.goToDashboard}
                    btnClass={styles.openIcon}
                    itemClass={LinkButtonStyles.button}
                >
                    Go to Dashboard
                    <p className={styles.subTitle}>
                        or press 'Enter' in search box
                    </p>
                </Button>
            </div>
        )
    }
}

export default LinkButton
