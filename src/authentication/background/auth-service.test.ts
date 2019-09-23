// import * as expect from 'expect'
// import {
//     AuthService,
//     AuthSubscriptionExpired,
//     AuthSubscriptionNotPresent,
// } from 'src/authentication/background/auth-service'
// import { subscriptionEventKeys } from 'src/authentication/background/types'
// import { SubscriptionService } from 'src/authentication/background/subscription-service'
// import { SubscriptionChargebeeFirebase } from 'src/authentication/background/subscription-chargebee-firebase'
// import {
//     MockAuthImplementation,
//     MockChargebeeInstance,
//     MockLinkGenerator,
// } from 'src/authentication/background/mocks/auth-mocks'
//
// const sinon = require('sinon')
// describe('Authentication Subscription Status Tests', () => {
//     it('should not be subscribed to pro plan if user is new', async () => {
//         const authService = new AuthService(MockAuthImplementation.newUser())
//
//         expect(authService.checkValidPlan('pro')).rejects.toThrowError(
//             AuthSubscriptionNotPresent,
//         )
//         expect(await authService.checkValidPlanQuiet('pro')).toBeFalsy()
//     })
//
//     it('should not be subscribed to pro plan if subscription expired', async () => {
//         const authService = new AuthService(
//             MockAuthImplementation.expiredProSubscription(),
//         )
//
//         expect(authService.checkValidPlan('pro')).rejects.toThrowError(
//             AuthSubscriptionExpired,
//         )
//         expect(await authService.checkValidPlanQuiet('pro')).toBeFalsy()
//     })
//
//     it('should be subscribed to pro plan if subscription is valid', async () => {
//         const authService = new AuthService(
//             MockAuthImplementation.validProSubscription(),
//         )
//
//         expect(await authService.checkValidPlan('pro')).toBeTruthy()
//         expect(await authService.checkValidPlanQuiet('pro')).toBeTruthy()
//     })
// })
//
// function mockSubscriptionService() {
//     const authService = new AuthService(MockAuthImplementation.newUser())
//     return new SubscriptionService(
//         new SubscriptionChargebeeFirebase(
//             new MockLinkGenerator(),
//             new MockChargebeeInstance(),
//         ),
//         authService,
//     )
// }
//
// describe('Authentication Subscription Checkout Tests', () => {
//     it('checkout should first return a link to check the user out', async function() {
//         this.skip()
//         const spy = sinon.spy()
//
//         const subscriptionService = mockSubscriptionService()
//
//         const checkoutEmitter = await subscriptionService.checkout({
//             subscriptionPlanId: 'pro',
//         })
//         subscriptionEventKeys.forEach(key => checkoutEmitter.on(key, spy))
//
//         spy.firstCall.calledWith(['externalUrl'])
//     })
//
//     it('should complete the checkout process', async function() {
//         this.skip()
//         const spy = sinon.spy()
//
//         const subscriptionService = mockSubscriptionService()
//
//         const checkoutEmitter = await subscriptionService.checkout({
//             subscriptionPlanId: 'pro',
//         })
//         subscriptionEventKeys.forEach(key => checkoutEmitter.on(key, spy))
//
//         const expectedCalls = [['started', '']]
//
//         for (let i = 0; i < expectedCalls.length; i++) {
//             spy.getCall(i).calledWith(expectedCalls[i])
//         }
//     })
// })
//
// describe('Authentication Subscription Firebase Functions Checkout Tests', function() {
//     beforeEach(async function() {
//         this.timeout(10000)
//
//         const test = require('firebase-functions-test')()
//         test.mockConfig({
//             chargebee: {
//                 site: 'wbstaging-test',
//                 apiKey: 'test_iup3O9dicdcIGJcdByGyxWd9UZWXgAbS6R',
//             },
//         })
//         const myFunctions = require('../../../functions/src/index')
//
//         // const getCheckoutLink = test.wrap(myFunctions.getCheckoutLink);
//         // const result1 = await getCheckoutLink({planId:"cbdemo_grow"},{auth: {uid: "cbdemo_john", token:{email:'john@example.com'}}})
//         // console.log(result1);
//
//         const getManageLink = test.wrap(myFunctions.getManageLink)
//         const result2 = await getManageLink(
//             { redirectUrl: 'https://memex.io' },
//             {
//                 auth: {
//                     uid: 'cbdemo_john',
//                     token: { email: 'john@example.com' },
//                 },
//             },
//         )
//         console.log(result2)
//     })
//
//     it('ce', async () => {
//         const spy = sinon.spy()
//     })
// })
