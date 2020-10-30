import express from "express";
import bcrypt from "bcryptjs";
import mongooseSetup from "./db/mongoose";
import userRouter from "./routers/user";
import taskRouter from "./routers/task";

//PORT
const port = process.env.PORT;
//Init app
const app = express();
//To serve up json requests
app.use(express.json());
//Connect to mongoDB
mongooseSetup();
//Routers
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => console.log("Server is up on port " + port));
