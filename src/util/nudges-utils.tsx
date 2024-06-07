import React, { Component } from 'react'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import {
    ONBOARDING_NUDGES_DEFAULT,
    ONBOARDING_NUDGES_MAX_COUNT,
    ONBOARDING_NUDGES_STORAGE,
} from 'src/content-scripts/constants'
import { Browser } from 'webextension-polyfill'
import styled from 'styled-components'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { Placement } from '@popperjs/core'

export async function updateNudgesCounter(
    nudgeType: string,
    browserAPIs: Browser,
) {
    const onboardingNudgesStorage = await browserAPIs.storage.local.get(
        ONBOARDING_NUDGES_STORAGE,
    )
    let onboardingNudgesValues =
        onboardingNudgesStorage[ONBOARDING_NUDGES_STORAGE] ??
        ONBOARDING_NUDGES_DEFAULT

    let nudgeKeyCount = onboardingNudgesValues[nudgeType]
    if (nudgeKeyCount == null) {
        return false
    } else {
        nudgeKeyCount = nudgeKeyCount + 1
        if (nudgeKeyCount > ONBOARDING_NUDGES_MAX_COUNT[nudgeType]) {
            nudgeKeyCount = 0
        }

        onboardingNudgesValues[nudgeType] = nudgeKeyCount

        await browserAPIs.storage.local.set({
            [ONBOARDING_NUDGES_STORAGE]: onboardingNudgesValues,
        })

        if (nudgeKeyCount === ONBOARDING_NUDGES_MAX_COUNT[nudgeType]) {
            return true
        }
        return false
    }
}
export async function disableNudgeType(
    nudgeType: string,
    browserAPIs: Browser,
) {
    const onboardingNudgesStorage = await browserAPIs.storage.local.get(
        ONBOARDING_NUDGES_STORAGE,
    )
    let onboardingNudgesValues =
        onboardingNudgesStorage[ONBOARDING_NUDGES_STORAGE] ??
        ONBOARDING_NUDGES_DEFAULT

    let nudgeKeyValues = onboardingNudgesValues[nudgeType]
    if (nudgeKeyValues == null) {
        return false
    } else {
        onboardingNudgesValues[nudgeType] = null

        await browserAPIs.storage.local.set({
            [ONBOARDING_NUDGES_STORAGE]: onboardingNudgesValues,
        })
        return true
    }
}

export function renderNudgeTooltip(
    nudgeTitle: string | JSX.Element,
    nudgeText: string | JSX.Element,
    hotKeys: JSX.Element | string | null,
    width: string,
    hideNudge: () => void,
    snoozeNudge: () => void,
    getRootElement: () => HTMLElement,
    targetElementRef: HTMLElement | HTMLDivElement | any,
    placement: Placement,
) {
    return (
        <PopoutBox
            getPortalRoot={getRootElement}
            placement={placement}
            targetElementRef={targetElementRef}
            offsetX={10}
            instaClose
            strategy="fixed"
            clickThrough={true}
            noStyles
        >
            <NudgeContainer width={width}>
                {hotKeys ? <HotKeysBox>{hotKeys} </HotKeysBox> : null}
                {nudgeTitle ? <NudgeTitle>{nudgeTitle}</NudgeTitle> : null}
                {nudgeText ? <NudgeText>{nudgeText}</NudgeText> : null}
                <NudgeBottomNote>
                    <PrimaryAction
                        onClick={snoozeNudge}
                        label={'Remind me again'}
                        type={'secondary'}
                        size={'small'}
                        padding={'2px 6px'}
                        fullWidth
                    />
                    <PrimaryAction
                        onClick={hideNudge}
                        label={'Hide Forever'}
                        type={'primary'}
                        size={'small'}
                        padding={'2px 6px'}
                        fullWidth
                    />
                </NudgeBottomNote>
            </NudgeContainer>
        </PopoutBox>
    )
}

const NudgeContainer = styled.div<{
    width: string
}>`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 5px;
    padding: 20px;
    background: ${(props) => props.theme.colors.prime1};
    border-radius: 14px;
    width: ${(props) => (props.width ? props.width : '300px')};
    position: relative;
`

const HotKeysBox = styled.div`
    position: absolute;
    top: 20px;
    right: 20px;
`

const NudgeTitle = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    line-height: 1.5;
    color: ${(props) => props.theme.colors.black1};
    font-size: 18px;
    font-weight: 900;
    text-align: left;
`
const NudgeText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;
    line-height: 1.5;
    color: ${(props) => props.theme.colors.black};
    font-size: 16px;
    text-align: left;
`
const NudgeBottomNote = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    grid-gap: 10px;
    line-height: 1.5;
    padding: 10px 0px 0 0px;
    color: ${(props) => props.theme.colors.blac};
    font-size: 12px;
    text-align: center;
    border-top: 1px solid ${(props) => props.theme.colors.white};
    box-sizing: border-box;
    width: 100%;
    margin-top: 15px;
    margin-bottom: -5px;
`
