import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { registerSchema, loginSchema } from "../schemas/authSchemas.js";
import { ApiError } from "../utils/apiError.js";

export async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) throw new ApiError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ email: body.email, passwordHash, name: body.name });

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    res.status(201).json({ ok: true, token });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email });
    if (!user) throw new ApiError(401, "Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Invalid credentials");

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    res.json({ ok: true, token });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select("_id email name");
    if (!user) throw new ApiError(404, "User not found");
    res.json({ ok: true, user });
  } catch (e) {
    next(e);
  }
}

