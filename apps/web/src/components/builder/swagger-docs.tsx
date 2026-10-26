'use client';

import type { BuilderEndpoint } from '@/lib/builder-api';
import { groupEndpointsByTag } from '@/lib/builder-docs';
import { SwaggerEndpoint } from '@/components/builder/swagger-endpoint';

type Props = {
    projectId: string;
    endpoints: BuilderEndpoint[];
    editable?: boolean;
    onEdit?: (endpoint: BuilderEndpoint) => void;
    onDelete?: (endpoint: BuilderEndpoint) => void;
    onOpenInPlayground?: (endpoint: BuilderEndpoint) => void;
};

export function SwaggerDocs({ projectId, endpoints, editable = false, onEdit, onDelete, onOpenInPlayground }: Props) {
    const groups = groupEndpointsByTag(endpoints);

    if (endpoints.length === 0) {
        return (
            <div className="rounded-lg border border-dashed border-border bg-surface px-4 py-10 text-center text-sm text-muted">
                No endpoints yet. Create one to see Swagger-style documentation here.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {groups.map(({ tag, endpoints: tagged }) => (
                <section key={tag} aria-labelledby={`tag-${tag}`}>
                    <div className="mb-3 flex items-end justify-between gap-3 border-b border-border pb-2">
                        <div>
                            <h3 id={`tag-${tag}`} className="text-lg font-semibold capitalize tracking-tight">
                                {tag}
                            </h3>
                            <p className="text-xs text-muted">
                                {tagged.length} operation{tagged.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {tagged.map((endpoint) => (
                            <SwaggerEndpoint
                                key={endpoint.id}
                                projectId={projectId}
                                endpoint={endpoint}
                                editable={editable}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onOpenInPlayground={onOpenInPlayground}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
