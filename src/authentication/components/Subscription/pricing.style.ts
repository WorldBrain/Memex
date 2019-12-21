import styled from 'styled-components'
import {
    colorPrimary,
    colorSecondary,
} from 'src/common-ui/components/design-library/colors'

const PricingTable = styled.div`
    border-radius: 5px;
    padding: 10px 13px;
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 20px;

    border-width: 3px;
    border-style: solid;
    border-color: rgb(92, 217, 166);
    color: rgb(84, 73, 96);

    &.free-plan {
        border: 3px solid ${colorPrimary};
        margin-right: 15px;
        h2 {
            color: ${colorPrimary};
        }
        @media (max-width: 767px) {
            margin-right: 0;
        }
    }

    &.pro-plan {
        border: 3px solid ${colorSecondary};
        margin-left: 15px;
        h2 {
            color: ${colorSecondary};
        }
        @media (max-width: 767px) {
            margin-left: 0;
        }
    }

    @media (max-width: 767px) {
        padding: 10px 13px;
        width: 100%;
        min-height: 0;
    }
`

const DeviceSelection = styled.div`
    color: ${colorSecondary};
    input {
        border: 1px solid ${colorSecondary};
        width: 55px;
        margin: 0 10px;
        &:focus {
            border: 1px solid ${colorSecondary};
        }
    }
    display: flex;
    align-items: center;
    margin-bottom: 20px;
`

const PricingPlanTitle = styled.h1`
    box-sizing: border-box;
    margin-bottom: 30px;
    margin-top: 30px;
    font-size: 35px;
    color: black;
    display: block;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.1em;
`

const PricingHead = styled.div`
    display: flex;
`

const PricingHeadTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 500;
    color: ${colorPrimary};
    text-align: center;
`

const PricingPrice = styled.div`
    margin-bottom: 20px;
    display: flex;
    font-size: 2.5rem;
    color: rgb(58, 47, 69);
    text-align: center;
`

const PricingButton = styled.div`
    flex-direction: column;
    background: ${props =>
        props.background ? props.background : 'rgb(64, 182, 154)'};
    color: white;
    cursor: pointer;
    -webkit-box-align: center;
    align-items: center;
    -webkit-box-pack: center;
    justify-content: center;
    min-width: 48px;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    padding-top: 8px;
    padding-bottom: 8px;
    //background-color: rgb(86, 113, 207);
    box-sizing: border-box;
    margin: 20px;
    padding-left: 10px;
    padding-right: 10px;
    width: 222px;
    max-width: 100%;
    display: flex;
    border-radius: 3px;
    text-decoration: none;
    border-width: 0px;
    border-style: initial;
    border-image: initial;
    transition: all 0.3s ease 0s;
`

const PricingList = styled.div`
    display: flex;
    flex-direction: column;
    width: 80%;
    line-height: 1.3em;
    text-align: center;
`

const ListItem = styled.div`
    margin-bottom: 19px;
    justify-content: center;
    display: inline-flex;
    &:last-child {
        margin-bottom: 0;
    }
    svg {
        color: #18d379;
        fill: #18d379;
        margin-right: 10px;
    }
`

const SwitchWrapper = styled.div`
  text-align: center;
  margin-top: 20px;
  .reusecore__switch {
    .reusecore__field-label {
      font-size: 16px;
      font-weight: 400;
      color: ${colorSecondary}
      cursor: pointer;
    }
    input[type='checkbox'] {
      &:checked {
        + div {
          width: 40px !important;
          background-color: ${colorPrimary};
          > div {
            left: 17px !important;
          }
        }
      }
      + div {
        background-color: #f0f0f0;
        background-color: #f0f0f0;
        border: 0;
        width: 40px;
        height: 25px;
        > div {
          background-color: #fff;
          box-shadow: 0px 2px 3px 0.24px rgba(31, 64, 104, 0.25);
          width: 21px;
          height: 21px;
          top: 2px;
          left: 2px;
        }
      }
    }
  }
`

const PricingButtonWrapper = styled.div`
    text-align: center;
    margin-top: 30px;
    .reusecore__button {
        font-size: 1rem;
        font-weight: 400;
        color: ${colorPrimary};
        background: #fff;
        height: 50px;
        width: 165px;
        border: 1px solid ${colorPrimary};
        &:nth-child(1) {
            border-top-left-radius: 5px;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 5px;
            border-right-color: transparent;
        }
        &:nth-child(2) {
            border-top-left-radius: 0;
            border-top-right-radius: 5px;
            border-bottom-right-radius: 5px;
            border-bottom-left-radius: 0;
            border-left-color: transparent;
        }
        &.active-item {
            color: #fff;
            background: ${colorSecondary};
            border-color: ${colorSecondary};
        }
        @media (max-width: 575px) {
            font-size: 14px;
            height: 44px;
            width: 120px;
            padding: 0 5px;
        }
    }
`

export {
    PricingPlanTitle,
    PricingHead,
    PricingPrice,
    PricingButton,
    PricingList,
    PricingHeadTitle,
    ListItem,
    SwitchWrapper,
    PricingButtonWrapper,
    DeviceSelection,
}
export default PricingTable
