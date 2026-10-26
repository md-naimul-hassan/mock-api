import type { Comment, Post } from '@mockapis/api-spec';
import { createRandom } from '../../util/random';

const COMMENTS = [
    'This is exactly what I needed today, thank you!',
    'Great write-up. I tried this last week and it worked well.',
    'I had the same experience, especially with the first point.',
    'Bookmarking this for later.',
    'Could you share more details about how you got started?',
    'Really clear explanation, even for a beginner like me.',
    'I disagree a little, but I appreciate the perspective.',
    'This made me smile. Thanks for sharing.',
    'The second paragraph is spot on.',
    'I am going to try this over the weekend.',
    'Sent this to a friend who will love it.',
    'Interesting! I never thought about it that way.',
    'Short, practical, and useful. More posts like this, please.',
    'Do you have any recommendations for someone just starting out?',
    'This brought back good memories.',
    'I wish I had read this a year ago.',
    'Love the honesty in this post.',
    'Tried it, and it really does make a difference.',
    'What would you do differently next time?',
    'Simple advice that is easy to forget. Thanks for the reminder.',
    'Following for the next update!',
    'This is a great example of keeping things simple.',
    'Your experience matches mine almost exactly.',
    'Thanks for writing this, it was a nice read with my morning coffee.',
];

export function buildComments(posts: Post[], userCount: number): Comment[] {
    const random = createRandom(4004);
    const comments: Comment[] = [];

    for (let id = 1; id <= 300; id++) {
        // The first 100 comments guarantee every post has at least one comment.
        const post = id <= posts.length ? posts[id - 1] : random.pick(posts);
        let userId = random.int(1, userCount);
        if (userId === post.userId) userId = (userId % userCount) + 1;
        comments.push({
            id,
            body: random.pick(COMMENTS),
            postId: post.id,
            userId,
            likes: random.int(0, 60),
        });
    }
    return comments;
}
