import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Household from '../models/Household.js';
import { env } from '../config/env.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, household: user.household }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// POST /api/auth/register-household — creates a parent + a new household
export async function registerHousehold(req, res, next) {
  try {
    const { householdName, parentName, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const household = await Household.create({ name: householdName });
    const parent = await User.create({
      name: parentName,
      email,
      passwordHash,
      role: 'parent',
      household: household._id,
    });
    household.parents.push(parent._id);
    await household.save();

    res.status(201).json({ token: signToken(parent), user: parent });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/invite-teen — parent creates a login for their teen
export async function inviteTeen(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const teen = await User.create({
      name,
      email,
      passwordHash,
      role: 'teen',
      household: req.user.household,
    });
    await Household.findByIdAndUpdate(req.user.household, { $push: { teens: teen._id } });

    res.status(201).json({ user: teen });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
}
