import mongoose, { Schema } from "mongoose";
import User, { IUser } from "./user";

export interface ITask extends mongoose.Document {
  description: string;
  completed: boolean;
  owner: string | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema: mongoose.Schema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model<ITask>("Task", taskSchema);

export default Task;
