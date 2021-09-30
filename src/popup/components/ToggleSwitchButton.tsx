import React from 'react'

import Button from './Button'
import ToggleSwitch from './ToggleSwitch'

const styles = require('./ToggleSwitchButton.css')

export interface Props {
    btnIcon: string
    btnText: string
    isEnabled: boolean
    btnSubText?: string
    btnHoverText?: string
    toggleHoverText?: string
    onBtnClick: React.MouseEventHandler
    onToggleClick: React.MouseEventHandler
}

export const ToggleSwitchButton = (props: Props) => (
    <div className={styles.switchBlocks}>
        <div className={styles.option}>
            <Button
                onClick={props.onBtnClick}
                itemClass={styles.button}
                btnClass={props.btnIcon}
                title={props.btnHoverText}
            >
                <div className={styles.buttonInner}>
                    {props.btnText}
                    {props.btnSubText && (
                        <p className={styles.subTitle}>{props.btnSubText}</p>
                    )}
                </div>
            </Button>
        </div>
        <div className={styles.switch} title={props.toggleHoverText}>
            <ToggleSwitch
                isChecked={props.isEnabled}
                onChange={props.onToggleClick}
            />
        </div>
    </div>
)
