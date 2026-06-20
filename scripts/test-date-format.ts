import { formatDateForInput } from '../src/lib/utils'

console.log('string ISO:', formatDateForInput('2019-03-15T00:00:00.000Z'))
console.log('Date object:', formatDateForInput(new Date('2019-03-15T00:00:00.000Z')))
console.log('short string:', formatDateForInput('2019-03-15'))
console.log('null:', formatDateForInput(null))
console.log('undefined:', formatDateForInput(undefined))
