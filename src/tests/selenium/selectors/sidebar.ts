import { Selector } from './types'

export const root: Selector = () => `div`

export const ribbonTriggerRoot: Selector = () =>
    `${root()} > div > div.src-sidebar-overlay-ribbon-components-__ribbon--1eodv`

export const ribbonRoot: Selector = () => `${root()} > div > div > div`

export const sidebarRoot: Selector = () =>
    `${root()} > div:nth-child(2) > div.bm-menu-wrap > div.bm-menu > nav > div`

export const ribbonGeneralActionBtns: Selector = () =>
    `${ribbonRoot()} > div.src-sidebar-overlay-ribbon-components-__generalActions--1YrZ4`

export const ribbonGeneralActionBtn: Selector<{ btnIndex: number }> = ({
    btnIndex,
}) => `${ribbonGeneralActionBtns()} > div:nth-child(${btnIndex + 1}) > div`

export const ribbonPageActionBtns: Selector = () =>
    `${ribbonRoot()} > div.src-sidebar-overlay-ribbon-components-__pageActions--HxmKI`

export const ribbonPageActionBtn: Selector<{ btnIndex: number }> = ({
    btnIndex,
}) => `${ribbonPageActionBtns()} > div:nth-child(${btnIndex + 1}) > div`

export const sidebarSearchBar: Selector = () =>
    `${sidebarRoot()} > div.src-sidebar-overlay-sidebar-components-__topSection--K4A_Q`

export const sidebarSearchResults: Selector = () =>
    `${sidebarRoot()} > div.src-sidebar-overlay-sidebar-components-__resultsContainer--3Z_17 > div`
