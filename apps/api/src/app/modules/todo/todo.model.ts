import { model, Schema } from 'mongoose';
import { type ITodo, type TodoModel } from './todo.interface';

const todoSchema = new Schema<ITodo, TodoModel>(
    {
        id: { type: Number, required: true, unique: true },
        todo: { type: String, required: true },
        completed: { type: Boolean, required: true, index: true },
        userId: { type: Number, required: true, index: true },
    },
    { collection: 'todos', versionKey: false },
);

export const Todo = model<ITodo, TodoModel>('Todo', todoSchema);
