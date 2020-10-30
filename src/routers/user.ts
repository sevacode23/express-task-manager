import express, { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import sharp from "sharp";
import User, { IUser } from "../db/models/user";
import auth, { IUserAuthRequest } from "../middleware/auth";
import isValidPropsObject from "../db/utils/validateProps";

const router = express.Router();

router.get("/users/me", auth, async (req, res) => {
  const userAuthRequest = req as IUserAuthRequest;
  res.send(userAuthRequest.user);
});

router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post(
  "/users/login",
  async (req: express.Request<{}, {}, { email: string; password: string }>, res) => {
    try {
      const user = await User.findByCredentials(req.body.email, req.body.password);

      const token = await user.generateAuthToken();
      res.send({ user, token });
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  }
);

router.post("/users/logout", auth, async (req, res) => {
  const authRequest = req as IUserAuthRequest;
  const user = authRequest.user as IUser;

  user.tokens = user.tokens.filter((token) => token.token !== authRequest.token);

  try {
    await user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  const user = (req as IUserAuthRequest).user;

  try {
    user.tokens = [];
    await user.save();
    res.send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

const avatarUpload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image (.jpg, .jpeg or .png)"));
    }

    cb(null, true);
  },
});

const handleUploadRequest: RequestHandler = async (req, res) => {
  const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer();
  const user = (req as IUserAuthRequest).user;
  user.avatar = buffer;
  try {
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
};

const handleUploadError: ErrorRequestHandler = (error, req, res, next) => {
  res.status(400).send({ error: error.message });
};

router.post("/users/me/avatar", auth, avatarUpload.single("avatar"), handleUploadRequest, handleUploadError);

router.delete("/users/me/avatar", auth, async (req, res) => {
  const user = (req as IUserAuthRequest).user;
  user.avatar = undefined;
  try {
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

router.patch("/users/me", auth, async (req, res) => {
  const user = (req as IUserAuthRequest).user;
  const updates = Object.keys(req.body);

  const allowedProps = ["name", "age", "email", "password"];
  if (!isValidPropsObject(allowedProps, req.body)) {
    return res.status(400).send({ error: "Ivalid properties" });
  }

  updates.forEach((update: string) => {
    user.set(update, req.body[update]);
  });

  try {
    await user.save();
    res.send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  const user = (req as IUserAuthRequest).user;
  try {
    await user.remove();
    res.send(user);
  } catch (e) {
    res.status(500).send(e);
  }
});

export default router;
