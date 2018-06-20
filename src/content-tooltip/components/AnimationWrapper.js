import React from 'react'
import PropTypes from 'prop-types'

import styles from './tooltip.css'

/*
TODO:
- Animate icons leaving out.
- Streamline animation flow using enter and exit animations
*/
class AnimationWrapper extends React.Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
    }

    setRef = node => (this.container = node)

    render() {
        return (
            <div ref={this.setRef} className={styles.animationContainer}>
                {this.props.children}
            </div>
        )
    }
}

export default AnimationWrapper
