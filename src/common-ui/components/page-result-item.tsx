import React, { PureComponent } from 'react'
import cx from 'classnames'

import ResultItemActions from './result-item-actions'
import { Props } from './result-item'

class PageResultItem extends PureComponent<Omit<Props, 'goToAnnotation'>> {
    static defaultProps = {
        nullImg: '/img/null-icon.png',
    }

    render() {
        return (
            <React.Fragment>
                <div>
                    <div>
                        <div>
                            <div>
                                {this.props.favIcon ? (
                                    <img src={this.props.favIcon} />
                                ) : (
                                    <div>{''}</div>
                                )}
                            </div>
                            <div title={this.props.title}>
                                {this.props.title}
                            </div>
                        </div>
                        <div>
                            <ResultItemActions {...this.props} />
                        </div>
                    </div>
                    <div title={this.props.url}>{this.props.url}</div>
                    <div>
                        <div>
                            <div> {this.props.displayTime}</div>
                        </div>
                    </div>
                    {this.props.tags.length > 0 ? this.props.tagHolder : null}
                </div>
            </React.Fragment>
        )
    }
}

export default PageResultItem
