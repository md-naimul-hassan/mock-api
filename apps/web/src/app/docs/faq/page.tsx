import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DocsPage, H2 } from '@/components/docs/docs-page';

export const metadata: Metadata = {
    title: 'FAQ',
    description: 'Frequently asked questions about Mock APIs.',
    alternates: { canonical: '/docs/faq' },
};

const FAQS: { id: string; question: string; answer: ReactNode }[] = [
    {
        id: 'api-key',
        question: 'Do I need an API key?',
        answer: <p>No. Every endpoint is public. Only the demo authentication routes expect a bearer token, which you get from the demo login.</p>,
    },
    {
        id: 'post-not-saved',
        question: 'I created a record but GET does not return it. Is that a bug?',
        answer: (
            <p>
                No, writes are simulated on purpose. The API validates and responds as if the change happened, but the shared dataset never changes. Keep created records in
                your client state. See <Link href="/docs/getting-started#simulated-writes">simulated writes</Link>.
            </p>
        ),
    },
    {
        id: 'cors',
        question: 'Can I call it from the browser?',
        answer: (
            <p>
                Yes. CORS allows every origin without credentials, and useful headers such as <code>X-Request-Id</code> and the rate-limit headers are exposed to JavaScript.
                Cookies are never used.
            </p>
        ),
    },
    {
        id: 'real-data',
        question: 'Is any of the data real?',
        answer: <p>No. All names, emails, addresses, products, and quotes are fictional and generated from a fixed seed. Emails use example.com.</p>,
    },
    {
        id: 'production',
        question: 'Can I use it in production or to secure my app?',
        answer: (
            <p>
                No. It has rate limits, no uptime guarantee, and the authentication is a teaching tool with public credentials. Use it for learning, demos, and tests only.
            </p>
        ),
    },
    {
        id: '429',
        question: 'Why am I getting 429 Too Many Requests?',
        answer: (
            <p>
                You exceeded the per-IP <Link href="/docs/rate-limits">rate limit</Link>. Wait for the number of seconds in the <code>Retry-After</code> header. Shared
                networks (schools, offices) share one IP, so consider running your own instance for workshops.
            </p>
        ),
    },
    {
        id: 'self-host',
        question: 'Can I run my own copy?',
        answer: (
            <p>
                Yes. The project includes Docker and Docker Compose files for the API, MongoDB, and this website. Your own instance can use higher limits and is the right
                choice for CI pipelines and load tests.
            </p>
        ),
    },
    {
        id: 'openapi',
        question: 'Can I generate a client or import into Postman?',
        answer: (
            <p>
                Yes. Import the <Link href="/docs/openapi">OpenAPI document</Link> into Postman, Insomnia, or an OpenAPI code generator.
            </p>
        ),
    },
    {
        id: 'images',
        question: 'Where do the images come from?',
        answer: <p>The API serves its own deterministic SVG placeholders, so there are no third-party image hosts or broken links.</p>,
    },
];

export default function FaqPage() {
    return (
        <DocsPage href="/docs/faq" eyebrow="Guides" title="Frequently asked questions" lead="Quick answers to the questions people ask most.">
            {FAQS.map((faq) => (
                <section key={faq.id} aria-labelledby={faq.id}>
                    <H2 id={faq.id}>{faq.question}</H2>
                    {faq.answer}
                </section>
            ))}
        </DocsPage>
    );
}
