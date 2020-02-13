import React, { ReactChild, PureComponent } from 'react'
import cx from 'classnames'
import OnboardingMessage from './onboarding-message'

const styles = require('./ResultList.css')

export interface Props {
    scrollDisabled?: boolean
    isFilterBarActive?: boolean
    children: ReactChild[] | ReactChild
}

class ResultList extends PureComponent<Props> {
    static defaultProps = {
        scrollDisabled: false,
    }

    get mainClass() {
        return cx(styles.root, {
            [styles.lessHeight]: this.props.isFilterBarActive,
        })
    }

    render() {
        const showOnboarding = localStorage.getItem('stage.Onboarding')
        return (
            <ul
                className={cx(this.mainClass, {
                    [styles.filterBarActive]: this.props.isFilterBarActive,
                })}
            >
                {showOnboarding === 'true' && <OnboardingMessage />}
                {this.props.children}
                <div className={styles.infoBox} />
            </ul>
        )
    }
}

export default ResultList
