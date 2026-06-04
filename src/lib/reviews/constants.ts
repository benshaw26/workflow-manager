export const TARGET_CATEGORIES = [
  'restaurant', 'cafe', 'takeaway', 'hair salon', 'beauty salon',
  'nail salon', 'barbershop', 'dentist', 'physiotherapist', 'osteopath',
  'personal trainer', 'plumber', 'electrician', 'builder', 'cleaner',
  'dog groomer', 'driving instructor',
]

export const CHAIN_KEYWORDS = [
  ' ltd', ' limited', ' group', ' holdings', ' services group',
  ' national', ' uk-wide', ' plc', ' inc', ' corp', 'franchise', 'chain',
]

export const QUALIFICATION = {
  minReviews: 15, maxReviews: 100,
  minRating: 3.0, maxRating: 4.6,
  goodRating: 4.6, badRating: 3.0,
  maxReviewsLast90Days: 3, replyWindowDays: 30,
}

export const UK_REGIONS: Record<string, Array<{ name: string; lat: number; lng: number }>> = {
  'Buckinghamshire': [
    { name: 'Great Missenden', lat: 51.7026, lng: -0.7082 },
    { name: 'Amersham', lat: 51.6736, lng: -0.6074 },
    { name: 'Chesham', lat: 51.7051, lng: -0.6122 },
    { name: 'Wendover', lat: 51.7607, lng: -0.7468 },
    { name: 'Princes Risborough', lat: 51.7216, lng: -0.8349 },
    { name: 'Aylesbury', lat: 51.8168, lng: -0.8124 },
    { name: 'High Wycombe', lat: 51.6287, lng: -0.7482 },
    { name: 'Marlow', lat: 51.5710, lng: -0.7756 },
    { name: 'Beaconsfield', lat: 51.6067, lng: -0.6437 },
  ],
  'London': [
    { name: 'Central London', lat: 51.5074, lng: -0.1278 },
    { name: 'North London', lat: 51.5760, lng: -0.1068 },
    { name: 'South London', lat: 51.4613, lng: -0.1156 },
    { name: 'East London', lat: 51.5120, lng: -0.0175 },
    { name: 'West London', lat: 51.4900, lng: -0.3400 },
    { name: 'Croydon', lat: 51.3714, lng: -0.1004 },
    { name: 'Harrow', lat: 51.5836, lng: -0.3464 },
    { name: 'Kingston', lat: 51.4085, lng: -0.3064 },
  ],
  'South East': [
    { name: 'Oxford', lat: 51.7520, lng: -1.2577 },
    { name: 'Reading', lat: 51.4543, lng: -0.9781 },
    { name: 'Brighton', lat: 50.8225, lng: -0.1372 },
    { name: 'Southampton', lat: 50.9097, lng: -1.4044 },
    { name: 'Guildford', lat: 51.2362, lng: -0.5704 },
    { name: 'Basingstoke', lat: 51.2665, lng: -1.0874 },
    { name: 'Canterbury', lat: 51.2802, lng: 1.0789 },
    { name: 'Maidstone', lat: 51.2717, lng: 0.5270 },
    { name: 'Milton Keynes', lat: 52.0406, lng: -0.7594 },
    { name: 'St Albans', lat: 51.7550, lng: -0.3363 },
    { name: 'Watford', lat: 51.6565, lng: -0.3903 },
  ],
  'South West': [
    { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
    { name: 'Bath', lat: 51.3811, lng: -2.3590 },
    { name: 'Exeter', lat: 50.7184, lng: -3.5339 },
    { name: 'Plymouth', lat: 50.3755, lng: -4.1427 },
    { name: 'Swindon', lat: 51.5558, lng: -1.7797 },
    { name: 'Cheltenham', lat: 51.8994, lng: -2.0783 },
    { name: 'Bournemouth', lat: 50.7192, lng: -1.8808 },
  ],
  'Midlands': [
    { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
    { name: 'Coventry', lat: 52.4068, lng: -1.5197 },
    { name: 'Leicester', lat: 52.6369, lng: -1.1398 },
    { name: 'Nottingham', lat: 52.9548, lng: -1.1581 },
    { name: 'Derby', lat: 52.9225, lng: -1.4746 },
    { name: 'Wolverhampton', lat: 52.5861, lng: -2.1282 },
    { name: 'Northampton', lat: 52.2405, lng: -0.9027 },
  ],
  'North West': [
    { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { name: 'Liverpool', lat: 53.4084, lng: -2.9916 },
    { name: 'Preston', lat: 53.7632, lng: -2.7031 },
    { name: 'Chester', lat: 53.1935, lng: -2.8932 },
    { name: 'Warrington', lat: 53.3900, lng: -2.5970 },
    { name: 'Bolton', lat: 53.5780, lng: -2.4286 },
    { name: 'Lancaster', lat: 54.0465, lng: -2.8007 },
  ],
  'Yorkshire': [
    { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
    { name: 'Sheffield', lat: 53.3811, lng: -1.4701 },
    { name: 'Bradford', lat: 53.7960, lng: -1.7594 },
    { name: 'Hull', lat: 53.7457, lng: -0.3367 },
    { name: 'York', lat: 53.9600, lng: -1.0873 },
    { name: 'Harrogate', lat: 53.9920, lng: -1.5378 },
  ],
  'North East': [
    { name: 'Newcastle', lat: 54.9783, lng: -1.6178 },
    { name: 'Sunderland', lat: 54.9058, lng: -1.3817 },
    { name: 'Durham', lat: 54.7761, lng: -1.5733 },
    { name: 'Darlington', lat: 54.5274, lng: -1.5583 },
  ],
  'East of England': [
    { name: 'Cambridge', lat: 52.2053, lng: 0.1218 },
    { name: 'Norwich', lat: 52.6309, lng: 1.2974 },
    { name: 'Ipswich', lat: 52.0567, lng: 1.1482 },
    { name: 'Colchester', lat: 51.8959, lng: 0.8919 },
    { name: 'Peterborough', lat: 52.5695, lng: -0.2405 },
  ],
  'Scotland': [
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
    { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
    { name: 'Aberdeen', lat: 57.1497, lng: -2.0943 },
    { name: 'Dundee', lat: 56.4620, lng: -2.9707 },
    { name: 'Inverness', lat: 57.4778, lng: -4.2247 },
  ],
  'Wales': [
    { name: 'Cardiff', lat: 51.4816, lng: -3.1791 },
    { name: 'Swansea', lat: 51.6214, lng: -3.9436 },
    { name: 'Newport', lat: 51.5842, lng: -2.9977 },
  ],
}

export const TARGET_LOCATIONS = Object.values(UK_REGIONS).flat()
