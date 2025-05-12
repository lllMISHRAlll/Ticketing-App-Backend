import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  const userCount = await User.countDocuments();

  let role = "user";
  let team = null;
  let invitedBy = null;

  if (userCount === 0) {
    const newTeam = await Team.create({
      admin: [],
      members: [],
      pendingInvites: [],
    });
    role = "admin";
    team = newTeam._id;
  } else {
    const invitedTeam = await Team.findOne({ "pendingInvites.email": email });

    if (invitedTeam) {
      role = "teammember";
      team = invitedTeam._id;
      invitedBy = invitedTeam.admin[0];

      invitedTeam.pendingInvites = invitedTeam.pendingInvites.filter(
        (invite) => invite.email !== email
      );
      await invitedTeam.save();
    }
  }

  const newUser = await User.create({
    name,
    email,
    password,
    role,
    team,
    invitedBy,
  });

  if (role === "admin") {
    const createdTeam = await Team.findById(team);
    createdTeam.admin.push(newUser._id);
    newUser.team = createdTeam._id;
    await createdTeam.save();
    await newUser.save();
  }

  if (role === "teammember") {
    const joinedTeam = await Team.findById(team);
    joinedTeam.members.push(newUser._id);
    await joinedTeam.save();
  }

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    team: newUser.team || null,
    token: generateToken(newUser._id),
  });
});

export const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "User logged in",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message || "Login failed" });
  }
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});
