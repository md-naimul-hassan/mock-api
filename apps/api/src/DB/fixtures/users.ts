import type { User } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

export type UserFixture = User & { passwordHash?: string; password: string };

const FEMALE = [
    'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail',
    'Ella', 'Scarlett', 'Grace', 'Chloe', 'Victoria', 'Aria', 'Lily', 'Zoe', 'Hannah', 'Nora',
    'Layla', 'Leah', 'Hazel', 'Aurora', 'Maya', 'Naomi', 'Ruby', 'Clara', 'Iris', 'Elena',
    'Julia', 'Priya', 'Aisha', 'Mei', 'Sofia', 'Lucia', 'Freya', 'Ingrid', 'Emily', 'Amara',
];
const MALE = [
    'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
    'Mason', 'Ethan', 'Daniel', 'Jacob', 'Logan', 'Jackson', 'Sebastian', 'Jack', 'Owen', 'Samuel',
    'Mateo', 'Leo', 'Isaac', 'Gabriel', 'Julian', 'Caleb', 'Nathan', 'Ryan', 'Adrian', 'Omar',
    'Ravi', 'Kenji', 'Diego', 'Marco', 'Tomas', 'Felix', 'Hugo', 'Arjun', 'Kwame', 'Michael',
];
const NEUTRAL = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Avery', 'Quinn', 'Rowan', 'Sage', 'Skyler'];
const LAST = [
    'Johnson', 'Williams', 'Brown', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
    'Wilson', 'Anderson', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker',
    'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Roberts', 'Patel', 'Kim', 'Chen', 'Okafor', 'Silva',
    'Novak', 'Fischer', 'Rossi', 'Larsen', 'Tanaka', 'Haddad', 'Kowalski', 'Dubois', 'Brooks', 'Carter',
];
const CITIES = [
    { city: 'Denver', state: 'Colorado' },
    { city: 'Austin', state: 'Texas' },
    { city: 'Portland', state: 'Oregon' },
    { city: 'Seattle', state: 'Washington' },
    { city: 'Boston', state: 'Massachusetts' },
    { city: 'Chicago', state: 'Illinois' },
    { city: 'Phoenix', state: 'Arizona' },
    { city: 'Nashville', state: 'Tennessee' },
    { city: 'Atlanta', state: 'Georgia' },
    { city: 'San Diego', state: 'California' },
    { city: 'Minneapolis', state: 'Minnesota' },
    { city: 'Raleigh', state: 'North Carolina' },
    { city: 'Columbus', state: 'Ohio' },
    { city: 'Salt Lake City', state: 'Utah' },
    { city: 'Madison', state: 'Wisconsin' },
];
const STREETS = ['Maple Avenue', 'Oak Street', 'Cedar Lane', 'Pine Road', 'Elm Court', 'Birch Way', 'Willow Drive', 'Lakeview Terrace', 'Hillcrest Boulevard', 'Sunset Parkway', 'River Road', 'Meadow Lane'];
const COMPANIES = [
    'Northwind Labs', 'Bluepeak Systems', 'Lattice & Loom', 'Copperfield Analytics', 'Brightpath Health', 'Harborline Logistics',
    'Quillstone Media', 'Evergreen Robotics', 'Tidewater Finance', 'Summit Ridge Studios', 'Clearwave Energy', 'Foxglove Software',
];
const DEPARTMENTS: Record<string, string[]> = {
    Engineering: ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'],
    Design: ['Product Designer', 'UX Researcher', 'Design Lead'],
    Product: ['Product Manager', 'Senior Product Manager', 'Product Analyst'],
    Marketing: ['Marketing Specialist', 'Content Strategist', 'Growth Manager'],
    Sales: ['Account Executive', 'Sales Manager', 'Solutions Consultant'],
    Support: ['Support Specialist', 'Customer Success Manager'],
    Finance: ['Financial Analyst', 'Accountant', 'Controller'],
    Operations: ['Operations Coordinator', 'Operations Manager', 'Project Manager'],
};

export const SEED_REFERENCE_DATE = new Date('2026-01-01T00:00:00Z');
const pad = (value: number, length: number) => String(value).padStart(length, '0');

export function buildUsers(baseUrl: string): UserFixture[] {
    const random = createRandom(1001);
    const usernames = new Set<string>();
    const users: UserFixture[] = [];

    for (let id = 1; id <= 100; id++) {
        let firstName: string;
        let lastName: string;
        let gender: User['gender'];
        if (id === 1) {
            [firstName, lastName, gender] = ['Emily', 'Carter', 'female'];
        } else if (id === 2) {
            [firstName, lastName, gender] = ['Michael', 'Brooks', 'male'];
        } else {
            const roll = random.next();
            gender = roll < 0.46 ? 'female' : roll < 0.92 ? 'male' : 'non-binary';
            firstName = random.pick(gender === 'female' ? FEMALE : gender === 'male' ? MALE : NEUTRAL);
            lastName = random.pick(LAST);
        }

        let username = `${firstName}${lastName.charAt(0)}`.toLowerCase();
        for (let suffix = 2; usernames.has(username); suffix++) {
            username = `${firstName}${lastName.charAt(0)}${suffix}`.toLowerCase();
        }
        usernames.add(username);

        const age = id === 1 ? 32 : id === 2 ? 41 : random.int(18, 70);
        const birthYear = SEED_REFERENCE_DATE.getUTCFullYear() - age - 1;
        const birthDate = `${birthYear}-${pad(random.int(1, 12), 2)}-${pad(random.int(1, 28), 2)}`;
        const location = id === 1 ? CITIES[0] : random.pick(CITIES);
        const department = random.pick(Object.keys(DEPARTMENTS));
        const role: User['role'] = id === 1 ? 'admin' : id === 2 ? 'user' : random.next() < 0.06 ? 'admin' : random.next() < 0.12 ? 'moderator' : 'user';

        users.push({
            id,
            firstName,
            lastName,
            username,
            email: `${firstName}.${lastName}${id > 2 ? id : ''}@example.com`.toLowerCase(),
            phone: `+1 555-01${pad(id - 1, 2)}`,
            age,
            gender,
            birthDate,
            image: `${baseUrl}/api/v1/images/users/${id}`,
            role,
            address: {
                street: `${random.int(10, 9999)} ${random.pick(STREETS)}`,
                city: location.city,
                state: location.state,
                postalCode: pad(random.int(10000, 99999), 5),
                country: 'United States',
            },
            company: {
                name: random.pick(COMPANIES),
                department,
                title: random.pick(DEPARTMENTS[department]),
            },
            password: `${username}pass`,
        });
    }
    return users;
}
