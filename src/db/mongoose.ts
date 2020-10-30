import mongoose from "mongoose";

export default () => {
  const connectURL = process.env.MONGODB_URL as string;
  mongoose.connect(connectURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
};
