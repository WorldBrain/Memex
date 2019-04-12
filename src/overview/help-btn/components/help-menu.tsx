import React from 'react'
import cx from 'classnames'

import { MenuOptions, MenuOption } from '../types'

const styles = require('./help-menu.css')

export interface Props {
    menuOptions: MenuOptions
    extVersion: string
}

export class HelpMenu extends React.PureComponent<Props> {
    private renderFooter() {
        return (
            <div className={styles.footerText}>
                Memex {this.props.extVersion}
            </div>
        )
    }

    private renderMenuOption = (
        { text, link, small }: MenuOption,
        i: number,
    ) => (
        <li key={i} className={styles.menuItem}>
            <a
                className={cx(styles.text, { [styles.smallText]: small })}
                target="_blank"
                href={link}
            >
                {text}
            </a>
        </li>
    )

    private renderSeparator = (val, i: number) => (
        <hr key={i} className={styles.menuSeparator} />
    )

    render() {
        return (
            <div className={styles.menuContainer}>
                <ul className={styles.menu}>
                    {this.props.menuOptions.map(
                        (opt, i) =>
                            opt === '-'
                                ? this.renderSeparator(opt, i)
                                : this.renderMenuOption(opt, i),
                    )}
                </ul>
                {this.renderFooter()}
            </div>
        )
    }
}
