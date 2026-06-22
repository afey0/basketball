import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'MVR') {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'
    const day = String(d.getUTCDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getUTCMonth()]
    const year = d.getUTCFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return '—'
  }
}

export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return ''
  }
}

export function formatMonth(yearMonth: string) {
  // "2026-06" → "June 2026"
  try {
    const [yr, mo] = yearMonth.split('-').map(Number)
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = months[mo - 1]
    if (!monthName || isNaN(yr)) return yearMonth
    return `${monthName} ${yr}`
  } catch {
    return yearMonth
  }
}

export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function suggestAgeGroup(age: number): string {
  if (age <= 8) return 'U-8'
  if (age <= 10) return 'U-10'
  if (age <= 12) return 'U-12'
  if (age <= 14) return 'U-14'
  if (age <= 16) return 'U-16'
  return 'U-18'
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PAID: 'text-green-400 bg-green-400/10 border-green-400/20',
    UNPAID: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    OVERDUE: 'text-red-400 bg-red-400/10 border-red-400/20',
    PARTIAL: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    PRESENT: 'text-green-400 bg-green-400/10 border-green-400/20',
    ABSENT: 'text-red-400 bg-red-400/10 border-red-400/20',
    LATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    EXCUSED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    ACTIVE: 'text-green-400 bg-green-400/10 border-green-400/20',
    INACTIVE: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    SUSPENDED: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return map[status] || 'text-gray-400 bg-gray-400/10 border-gray-400/20'
}

export function generateReceiptNumber(studentId: number, month: string): string {
  return `RCP-${month.replace('-', '')}-${String(studentId).padStart(3, '0')}`
}

export const DAY_ORDER: Record<string, number> = {
  MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6,
}

export const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
}

export const AGE_GROUPS = ['U-8', 'U-10', 'U-12', 'U-14', 'U-16', 'U-18']

export const COUNTRIES = [
  'Maldives',
  'India', 'Sri Lanka', 'Malaysia', 'Singapore', 'United Kingdom', 'United States', 'Australia', 'Canada', 'New Zealand',
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czechia',
  'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
  'Fiji', 'Finland', 'France',
  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary',
  'Iceland', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
  'Oman',
  'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar',
  'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
  'Yemen',
  'Zambia', 'Zimbabwe'
]

export function validateCountryIdCard(country: string | null | undefined, idCardOrPassport: string | null | undefined): string | null {
  const c = country?.trim() || 'Maldives'
  const isMaldives = c.toLowerCase() === 'maldives'
  const val = idCardOrPassport?.trim() || ''

  if (isMaldives) {
    if (!val) {
      return 'ID Card is compulsory when country is Maldives.'
    }
    if (!/^[Aa]\d{6}$/.test(val)) {
      return 'ID Card must be in the format Axxxxxx (A followed by 6 digits).'
    }
  }
  return null
}

