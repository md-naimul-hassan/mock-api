import type { Post } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

type Topic = { tag: string; titles: string[]; sentences: string[] };

const TOPICS: Topic[] = [
    {
        tag: 'coding',
        titles: [
            'Why I write tests before fixing bugs', 'Five REST API habits that saved my team hours', 'Learning TypeScript one error at a time',
            'The day I finally understood async/await', 'Naming things is still the hardest part', 'How I review pull requests now',
            'Small commits, calmer releases', 'What a flaky test taught me about time zones', 'Debugging with print statements is fine',
            'Reading other people\'s code on purpose',
        ],
        sentences: [
            'The fix itself took ten minutes, but understanding the problem took most of the afternoon.',
            'Writing the failing test first made the bug impossible to ignore.',
            'Our team agreed on a few conventions and the code reviews became much shorter.',
            'Clear error messages turned out to be the best documentation we had.',
            'I keep a short checklist next to my keyboard for every release.',
            'Pairing for an hour was faster than a day of back-and-forth messages.',
        ],
    },
    {
        tag: 'coffee',
        titles: [
            'My slow Sunday pour-over routine', 'Finding the right grind size by taste', 'A beginner\'s guide to coffee ratios',
            'Cold brew experiments in a tiny kitchen', 'Why I stopped buying pre-ground coffee', 'The coffee shop that changed my mornings',
            'Light roast versus dark roast, honestly', 'Making decent espresso without a fancy machine', 'Coffee notes from a weekend road trip',
            'Brewing coffee for a crowd without stress',
        ],
        sentences: [
            'Weighing the beans felt fussy at first, but the cups became noticeably more consistent.',
            'A slightly coarser grind fixed the bitterness I had been blaming on the beans.',
            'The ritual matters as much as the result on slow mornings.',
            'Fresh water and a clean kettle make a bigger difference than I expected.',
            'I wrote down every recipe change in a small notebook for a month.',
            'Sharing a pot with neighbors turned into a weekly tradition.',
        ],
    },
    {
        tag: 'travel',
        titles: [
            'Packing light for a two-week trip', 'Getting lost on purpose in a new city', 'Train journeys worth taking slowly',
            'How I plan trips without over-planning', 'Lessons from a rainy hiking holiday', 'Eating like a local on a budget',
            'The quiet beauty of off-season travel', 'Notes from my first solo trip', 'Weekend escapes within a few hours of home',
            'Travel journaling for people who forget things',
        ],
        sentences: [
            'One backpack and a short list kept the whole trip simple.',
            'The best meal of the week came from a tiny place with no sign outside.',
            'Leaving a free afternoon in the schedule led to the most memorable moments.',
            'A local market told me more about the town than any guidebook.',
            'Rain changed our plans, and somehow the trip got better.',
            'I came home with fewer souvenirs and many more stories.',
        ],
    },
    {
        tag: 'fitness',
        titles: [
            'Building a running habit from zero', 'Why rest days made me stronger', 'A simple home workout that actually sticks',
            'Stretching routines for desk workers', 'What I learned training for my first 10K', 'Walking meetings changed my week',
            'Strength training without a gym membership', 'Tracking progress without obsessing over numbers', 'Morning workouts for night owls',
            'Staying active during a busy season',
        ],
        sentences: [
            'Consistency beat intensity every single week.',
            'Starting with ten minutes a day removed every excuse I had.',
            'A training log helped me notice progress I would have missed.',
            'Recovery days felt lazy until my times started improving.',
            'Finding a workout partner made early mornings much easier.',
            'Good shoes and a realistic plan mattered more than fancy gear.',
        ],
    },
    {
        tag: 'cooking',
        titles: [
            'Weeknight dinners in thirty minutes', 'Learning to cook with what is in the fridge', 'My favorite one-pan recipes',
            'Batch cooking for a calmer week', 'Simple sauces that upgrade any meal', 'Baking bread as a complete beginner',
            'Cooking for one without waste', 'Seasonal vegetables I keep coming back to', 'Spice blends worth making at home',
            'Hosting a dinner party on a small budget',
        ],
        sentences: [
            'Prepping vegetables on Sunday made weeknight cooking almost effortless.',
            'A squeeze of lemon at the end fixed more dishes than extra salt ever did.',
            'My first loaf was dense, but the fourth one was worth the wait.',
            'Cooking with friends turned a chore into the best part of the evening.',
            'Leftovers became new meals instead of forgotten containers.',
            'Keeping a few pantry staples on hand changed how often I cook.',
        ],
    },
    {
        tag: 'books',
        titles: [
            'Reading twenty minutes before bed', 'Books that changed how I work', 'Why I started rereading old favorites',
            'Joining a book club as an introvert', 'Audiobooks for long commutes', 'How I take notes while reading',
            'Finishing books I did not enjoy, and stopping', 'A reading list for curious beginners', 'Libraries are still underrated',
            'Reading in another language, slowly',
        ],
        sentences: [
            'A short daily habit added up to more books than I read in years.',
            'Writing one sentence about each chapter helped me remember what mattered.',
            'Some books only make sense at a certain point in life.',
            'Our book club spent more time talking about life than the plot.',
            'Giving myself permission to quit a book made reading fun again.',
            'The local library introduced me to authors I would never have found.',
        ],
    },
    {
        tag: 'productivity',
        titles: [
            'A to-do list that fits on an index card', 'Saying no to protect deep work', 'Weekly reviews in fifteen minutes',
            'Turning off notifications for a month', 'Planning tomorrow before leaving today', 'Time blocking without the guilt',
            'Batching small tasks to save energy', 'The two-minute rule in practice', 'Why I schedule breaks on purpose',
            'Keeping a done list instead of a to-do list',
        ],
        sentences: [
            'Three priorities per day felt small but kept me focused.',
            'Muting notifications gave me back whole hours of attention.',
            'Ending each day with a short plan made mornings far less chaotic.',
            'A weekly review caught problems before they became emergencies.',
            'Short breaks made the long afternoons noticeably more productive.',
            'Writing down what I finished was surprisingly motivating.',
        ],
    },
    {
        tag: 'music',
        titles: [
            'Learning guitar as an adult', 'Playlists for focused work', 'Discovering new music without algorithms',
            'Practicing scales without getting bored', 'My first open mic night', 'Vinyl records and slowing down',
            'Writing a song in a weekend', 'Music lessons over video calls', 'The joy of playing in a community band',
            'Building a tiny home recording setup',
        ],
        sentences: [
            'Fifteen minutes of practice each day beat one long weekend session.',
            'My hands shook during the first song, and then it was fun.',
            'Asking friends for recommendations brought back the joy of discovery.',
            'Recording myself was humbling and incredibly useful.',
            'Playing with other people taught me to listen more than I play.',
            'A simple setup was enough to start making music I am proud of.',
        ],
    },
    {
        tag: 'gardening',
        titles: [
            'Growing herbs on a small balcony', 'Composting in an apartment', 'Tomatoes taught me patience',
            'Choosing plants that survive neglect', 'My first raised garden bed', 'Saving seeds for next season',
            'Watering mistakes I made so you do not have to', 'Planting for bees and butterflies', 'Indoor plants for low light',
            'A gardening calendar for beginners',
        ],
        sentences: [
            'Basil and mint thrived where I expected nothing to grow.',
            'Overwatering killed more plants than forgetting ever did.',
            'The first ripe tomato tasted better than anything from the store.',
            'Starting small kept the garden enjoyable instead of overwhelming.',
            'Neighbors traded cuttings and advice over the fence all summer.',
            'Keeping notes each season made the next year much easier.',
        ],
    },
    {
        tag: 'photography',
        titles: [
            'Better photos with the phone you already have', 'Shooting in golden hour', 'Learning composition with one lens',
            'Editing photos without overdoing it', 'A photo walk around my neighborhood', 'Portraits of friends, not models',
            'Black and white photography for beginners', 'Organizing thousands of photos', 'Photographing food in natural light',
            'Printing photos again',
        ],
        sentences: [
            'Walking slowly helped me notice light I usually ignore.',
            'Using a single lens forced me to move my feet and think about framing.',
            'Subtle edits made the photos feel more honest.',
            'Printing my favorites made me appreciate them in a new way.',
            'The best shots happened when people forgot about the camera.',
            'A simple folder system finally tamed my photo library.',
        ],
    },
];

const EXTRA_TAGS = ['beginners', 'tips', 'lifestyle', 'learning', 'weekend', 'habits', 'story'];

export function buildPosts(userCount: number): Post[] {
    const random = createRandom(3003);
    const posts: Post[] = [];

    for (let index = 0; index < 100; index++) {
        const topic = TOPICS[index % TOPICS.length];
        const title = topic.titles[Math.floor(index / TOPICS.length)];
        const id = index + 1;
        const likes = random.int(0, 900);
        posts.push({
            id,
            title,
            body: random.sample(topic.sentences, 3).join(' '),
            userId: id <= 3 ? 1 : random.int(1, userCount),
            tags: [topic.tag, ...random.sample(EXTRA_TAGS, random.int(1, 2))],
            reactions: { likes, dislikes: random.int(0, Math.max(5, Math.floor(likes / 10))) },
            views: likes * random.int(3, 9) + random.int(0, 300),
        });
    }
    return posts;
}
