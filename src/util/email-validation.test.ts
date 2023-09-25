import { isValidEmail } from '@worldbrain/memex-common/lib/utils/email-validation'

describe('isValidEmail', () => {
    it('should return true for a valid email address', () => {
        expect(isValidEmail('john.doe@example.com')).toBeTruthy()
        expect(isValidEmail('johndoe@example.co')).toBeTruthy()
        expect(isValidEmail('john.doe@example.com.au')).toBeTruthy()
        expect(isValidEmail('johndoe@a.com.uk')).toBeTruthy()
        expect(isValidEmail('johndoe@sub.a.com.uk')).toBeTruthy()
    })

    it('should return false for an invalid email address', () => {
        expect(isValidEmail('johndoeATexampleDOTcom')).toBeFalsy()
        expect(isValidEmail('john.doeATexample.com')).toBeFalsy()
        expect(isValidEmail('johndoe.example')).toBeFalsy()
        expect(isValidEmail('johndoe@')).toBeFalsy()
    })
})
