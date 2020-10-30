import express, { RequestHandler } from "express";
import Task from "../db/models/task";
import auth, { IUserAuthRequest } from "../middleware/auth";
import isValidId from "../db/utils/validateId";
import isValidPropsObject from "../db/utils/validateProps";

const router = express.Router();

router.get("/tasks/:id", auth as RequestHandler, async (req, res) => {
  const _id = req.params.id;

  if (!isValidId(_id)) {
    return res.status(404).send();
  }

  try {
    const task = await Task.findOne({ _id: _id, owner: (req as IUserAuthRequest).user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

//GET /tasks?sortBy=createdAt:desc

router.get("/tasks", auth as RequestHandler, async (req, res) => {
  const match: any = {};
  const sort: any = {};
  const user = (req as IUserAuthRequest).user;

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = (req.query.sortBy as string).split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    // const tasks = await Task.find({ owner: user._id });
    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit as string),
          skip: parseInt(req.query.skip as string),
          sort,
        },
      })
      .execPopulate();
    res.send(user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/tasks", auth as RequestHandler, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: (req as IUserAuthRequest).user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.patch("/tasks/:id", auth as RequestHandler, async (req, res) => {
  const _id = req.params.id;

  if (!isValidId(_id)) {
    return res.status(404).send();
  }

  const allowedProps = ["description", "completed"];
  if (!isValidPropsObject(allowedProps, req.body)) {
    return res.status(400).send({ error: "Invalid properties to update!" });
  }

  try {
    const task = await Task.findOne({ _id: _id, owner: (req as IUserAuthRequest).user._id });

    if (!task) {
      return res.status(404).send();
    }

    const updates = Object.keys(req.body);
    updates.forEach((update: string) => {
      task.set(update, req.body[update]);
    });
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id", auth as RequestHandler, async (req, res) => {
  const _id = req.params.id;

  if (!isValidId(_id)) {
    return res.status(404).send();
  }

  try {
    const task = await Task.findOne({ _id: _id, owner: (req as IUserAuthRequest).user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

export default router;
