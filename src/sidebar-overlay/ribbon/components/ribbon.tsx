import * as React from 'react'
import cx from 'classnames'

import { getExtUrl } from '../../utils'
import { ClickHandler } from '../../types'

const styles = require('./ribbon.css')

const arrowRibbon = getExtUrl('/img/arrow_ribbon.svg')
const logo = getExtUrl('/img/worldbrain-logo-narrow.png')

interface Props {
    isMouseHoveringOver: boolean
    isRibbonEnabled: boolean
    isTooltipEnabled: boolean
    openSidebar: ClickHandler<HTMLImageElement>
    handleRibbonToggle: ClickHandler<HTMLElement>
    handleTooltipToggle: ClickHandler<HTMLElement>
    handleRemoveRibbon: ClickHandler<HTMLElement>
}

/* tslint:disable-next-line variable-name */
const Ribbon = (props: Props) => {
    const {
        isMouseHoveringOver,
        isRibbonEnabled,
        isTooltipEnabled,
        openSidebar,
        handleTooltipToggle,
        handleRibbonToggle,
        handleRemoveRibbon,
    } = props

    return (
        <div
            className={cx(styles.ribbon, {
                [styles.ribbonExpanded]: isMouseHoveringOver,
            })}
        >
            {/* Ribbon arrow */}
            <div className={styles.arrowBox}>
                <img
                    onClick={openSidebar}
                    className={styles.arrow}
                    src={arrowRibbon}
                    title={'Open Annotation Sidebar'}
                />
            </div>
            {isMouseHoveringOver && (
                <div className={styles.buttons}>
                    {/* Worldbrain logo to open sidebar */}
                    <img
                        src={logo}
                        className={styles.logo}
                        onClick={openSidebar}
                        title={'Open Annotation Sidebar'}
                    />
                    {/* Button to turn tooltip on/off on all pages */}
                    <div
                        className={styles.buttonHolder}
                        onClick={handleTooltipToggle}
                    >
                        <span
                            className={cx(styles.toggler, {
                                [styles.tooltipOn]: isTooltipEnabled,
                                [styles.tooltipOff]: !isTooltipEnabled,
                            })}
                            title={'Turn on/off Highlighter on all pages'}
                        />
                    </div>
                    {/* Button to turn ribbon on/off on all pages */}
                    <div
                        className={styles.buttonHolder}
                        onClick={handleRibbonToggle}
                    >
                        <span
                            className={cx(styles.toggler, styles.tooltipIcon, {
                                [styles.ribbonOn]: isRibbonEnabled,
                                [styles.ribbonOff]: !isRibbonEnabled,
                            })}
                            title={'Turn on/off this ribbon on all pages'}
                        />
                    </div>
                    {/* Button to remove ribbon from the current page */}
                    <div
                        className={styles.buttonHolder}
                        onClick={handleRemoveRibbon}
                    >
                        <span
                            title={
                                'Close ribbon once. Disable via Memex icon in the extension toolbar.'
                            }
                            className={styles.cancel}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Ribbon
