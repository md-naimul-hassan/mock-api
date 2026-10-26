import { model, Schema } from 'mongoose';
import { GENDERS, USER_ROLES } from '@mockapis/api-spec';
import { type IUser, type UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
    {
        id: { type: Number, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: GENDERS, required: true },
        birthDate: { type: String, required: true },
        image: { type: String, required: true },
        role: { type: String, enum: USER_ROLES, required: true, index: true },
        address: {
            street: String,
            city: { type: String, index: true },
            state: String,
            postalCode: String,
            country: String,
        },
        company: {
            name: String,
            department: String,
            title: String,
        },
        passwordHash: { type: String, required: true, select: false },
    },
    { collection: 'users', versionKey: false },
);

export const User = model<IUser, UserModel>('User', userSchema);
