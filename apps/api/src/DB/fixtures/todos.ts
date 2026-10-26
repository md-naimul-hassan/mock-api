import type { Todo } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

const TODOS = [
    'Reply to project kickoff email', 'Buy groceries for the week', 'Water the balcony plants', 'Renew library books',
    'Schedule dentist appointment', 'Write unit tests for the login form', 'Back up laptop to external drive', 'Call the bank about the new card',
    'Plan weekend hike route', 'Read two chapters of the current book', 'Clean out the email inbox', 'Update resume with recent projects',
    'Fix the squeaky bedroom door', 'Prepare slides for Monday stand-up', 'Practice guitar for 20 minutes', 'Pick up dry cleaning',
    'Order a birthday gift for Sam', 'Review pull request #42', 'Cancel unused streaming subscription', 'Meal prep lunches for the week',
    'Take the recycling out', 'Book train tickets for the trip', 'Organize the photo library', 'Learn one new keyboard shortcut',
    'Go for a 30 minute run', 'Refill the coffee beans', 'Write a thank-you note', 'Check tire pressure on the bike',
    'Pay the electricity bill', 'Donate old clothes', 'Set up a budget spreadsheet', 'Update phone apps',
    'Call grandparents', 'Try a new recipe for dinner', 'Sort the junk drawer', 'Test the API error handling flow',
    'Replace the kitchen light bulb', 'Return the borrowed drill', 'Draft blog post outline', 'Stretch for ten minutes',
    'Clean the keyboard', 'Plan next week\'s priorities', 'Archive old project files', 'Confirm dinner reservation',
    'Change air filter', 'Write documentation for the playground', 'Charge camera batteries', 'Clear browser cache and test again',
    'Send invoice to client', 'Buy a new notebook',
];

export function buildTodos(userCount: number): Todo[] {
    const random = createRandom(5005);
    const todos: Todo[] = [];

    for (let id = 1; id <= 200; id++) {
        todos.push({
            id,
            todo: TODOS[(id - 1) % TODOS.length],
            completed: random.bool(0.45),
            // The first 100 todos guarantee every user has at least one todo.
            userId: id <= userCount ? id : random.int(1, userCount),
        });
    }
    return todos;
}
