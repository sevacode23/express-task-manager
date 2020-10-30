import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Task, { ITask } from "./task";

export interface IUser extends mongoose.Document {
  name: string;
  age?: number;
  email: string;
  password: string;
  tokens: { token: string }[];
  tasks?: ITask[];
  createdAt: Date;
  updatedAt: Date;
  avatar?: Buffer;
  generateAuthToken(): Promise<string>;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}
const userSchema: mongoose.Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      default: 0,
      min: 0,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      validate(value: string) {
        return validator.isEmail(value);
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      validate(value: string) {
        return !value.toLowerCase().includes("password");
      },
    },

    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.generateAuthToken = async function (): Promise<string> {
  const user = this as IUser;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET as string);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this as IUser;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

userSchema.statics.findByCredentials = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

userSchema.pre<IUser>("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

userSchema.pre<IUser>("remove", async function (next) {
  const user = this;

  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
