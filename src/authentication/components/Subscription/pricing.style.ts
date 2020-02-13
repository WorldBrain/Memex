import styled from 'styled-components'
import {
    colorPrimary,
    colorSecondary,
} from 'src/common-ui/components/design-library/colors'

const PricingTable = styled.div`
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    font-family: 
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgb(84, 73, 96);
    width: 200px;
    margin: 10px;

    &:hover {
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.4);
        cursor: pointer;
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
    font-weight: 700;
    font-size: 30px;
    color: #3a2f45;
    margin: 0 0 30px;
    text-align: center;
`

const PricingPlanItem = styled.div`
    box-sizing: border-box;
    font-weight: 300;
    font-size: 18px;
    margin: 30px 0;
    text-align: center;
`
const LoginTitle = styled.div`
    box-sizing: border-box;
    font-weight: 300;
    font-size: 18px;
    margin: 30px 0 10px;
    text-align: center;
`
const LoginButton = styled.div`
    box-sizing: border-box;
    font-weight: 700;
    font-size: 18px;
    margin-bottom: 20px;
    text-align: center;
    cursor: pointer;
`

const PricingHead = styled.div`
    display: flex;
    justify-content: center;
    color: #3a2f45;
    font-weight: 700;
`

const WhiteSpacer30 = styled.div`
    height: 30px;
`

const PricingHeadTitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 700;
    color: #3a2f45;
    text-align: center;
`

const PricingPrice = styled.div`
    margin-bottom: 20px;
    display: flex;
    font-size: 25px;
    color: #5cd9a6;
    text-align: center;
    justify-content: center;
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
    margin-bottom: 20px;
    padding-bottom: 8px;
    //background-color: rgb(86, 113, 207);
    box-sizing: border-box;
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
    margin-bottom: 40px;
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
    PricingPlanItem,
    LoginTitle,
    LoginButton,
    PricingHead,
    PricingPrice,
    WhiteSpacer30,
    PricingButton,
    PricingList,
    PricingHeadTitle,
    ListItem,
    SwitchWrapper,
    PricingButtonWrapper,
    DeviceSelection,
}
export default PricingTable
