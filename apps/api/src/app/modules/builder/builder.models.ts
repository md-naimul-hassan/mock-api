import { model, Schema, type Types } from 'mongoose';
import type { BuilderHttpMethod } from '@mockapis/api-spec';

export type IBuilderUser = {
    _id: Types.ObjectId;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
};

export type IMockProject = {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    name: string;
    description: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type IMockEndpoint = {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    method: BuilderHttpMethod;
    path: string;
    statusCode: number;
    requestBody: unknown;
    responseBody: unknown;
    responseHeaders: Record<string, string>;
    delayMs: number;
    description: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export const BuilderUser = model<IBuilderUser>(
    'BuilderUser',
    new Schema<IBuilderUser>(
        {
            username: { type: String, required: true, unique: true, lowercase: true, trim: true },
            email: { type: String, required: true, unique: true, lowercase: true, trim: true },
            passwordHash: { type: String, required: true, select: false },
        },
        { collection: 'builder_users', versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
    ),
);

export const MockProject = model<IMockProject>(
    'MockProject',
    new Schema<IMockProject>(
        {
            ownerId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'BuilderUser' },
            name: { type: String, required: true, trim: true },
            description: { type: String, default: '' },
            enabled: { type: Boolean, default: true },
        },
        { collection: 'mock_projects', versionKey: false, timestamps: true },
    ),
);

export const MockEndpoint = model<IMockEndpoint>(
    'MockEndpoint',
    new Schema<IMockEndpoint>(
        {
            projectId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'MockProject' },
            method: { type: String, required: true },
            path: { type: String, required: true },
            statusCode: { type: Number, required: true },
            requestBody: { type: Schema.Types.Mixed, default: null },
            responseBody: { type: Schema.Types.Mixed, default: null },
            responseHeaders: { type: Schema.Types.Mixed, default: {} },
            delayMs: { type: Number, default: 0 },
            description: { type: String, default: '' },
            enabled: { type: Boolean, default: true },
        },
        { collection: 'mock_endpoints', versionKey: false, timestamps: true },
    ),
);

MockEndpoint.schema.index({ projectId: 1, method: 1, path: 1 }, { unique: true });
