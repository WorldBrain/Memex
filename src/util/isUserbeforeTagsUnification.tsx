import getSignUpDate from 'src/util/getSignUpDate'

export default async function isUserBeforeTagsUnification() {
    const migrationDate = 1642114800
    const SignupDate = await getSignUpDate()

    if (SignupDate < migrationDate) {
        //console.log('true')
        return true
    } else {
        //console.log('false')
        return false
    }
}
