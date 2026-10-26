import { type Model } from 'mongoose';
import type { Todo } from '@mockapis/api-spec';

export type ITodo = Todo;

export type TodoModel = Model<ITodo>;
