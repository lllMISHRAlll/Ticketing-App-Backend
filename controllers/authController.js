import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
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
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

export const logout = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});
