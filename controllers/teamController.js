import Team from "../models/Team.js";
import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getTeamDetails = asyncHandler(async (req, res) => {
  const team = await Team.findOne()
    .populate("admin", "name email role")
    .populate("members", "name email role");

  if (!team) {
    res.status(404).json({ message: "No team Found" });
  }

  res.status(200).json({
    admin: team.admin,
    members: team.members,
    pendingInvites: team.pendingInvites,
  });
});

export const addTeammate = asyncHandler(async (req, res) => {
  const { email, name, role } = req.body;
  const inviterId = req.user._id;

  const inviter = await User.findById(inviterId);
  if (!inviter) {
    return res.status(404).json({ message: "Inviting user not found." });
  }

  const team = await Team.findById(inviter.team);
  if (!team) {
    return res.status(404).json({ message: "Team not found." });
  }

  const isAlreadyMember = await User.findOne({
    email,
    _id: { $in: team.members },
  });

  if (isAlreadyMember) {
    return res.status(400).json({ message: "User is already a team member." });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    existingUser.role = "teammember";
    existingUser.team = team._id;
    existingUser.invitedBy = inviterId;
    await existingUser.save();

    team.members.push(existingUser._id);
    await team.save();

    return res.status(200).json({ message: "User added to the team." });
  } else {
    const alreadyInvited = team.pendingInvites.find(
      (invite) => invite.email === email
    );

    if (alreadyInvited) {
      return res.status(400).json({ message: "User already invited." });
    }

    team.pendingInvites.push({ email, name, role });
    await team.save();

    return res.status(200).json({ message: "User added to pending invites." });
  }
});

export const updateTeammate = asyncHandler(async (req, res) => {
  const { email, username, role } = req.body;
  const { memberId } = req.params;
  const adminId = req.user._id;

  const adminUser = await User.findById(adminId);
  if (adminUser.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only an admin can update team members." });
  }

  const team = await Team.findOne({
    $or: [{ admin: adminId }, { members: adminId }],
  });

  if (!team) return res.status(404).json({ message: "Team not found" });

  const member = await User.findById(memberId);
  if (!member) {
    return res.status(404).json({ message: "Team member not found" });
  }

  const isInTeam =
    team.members.includes(memberId) || team.admin.includes(memberId);
  if (!isInTeam) {
    return res
      .status(400)
      .json({ message: "This user is not part of the team." });
  }

  if (email) member.email = email;
  if (username) member.name = username;

  if (role && role !== member.role) {
    if (role === "admin") {
      if (!team.admin.includes(memberId)) team.admin.push(memberId);
      team.members = team.members.filter(
        (id) => id.toString() !== memberId.toString()
      );
    } else if (role === "teammember") {
      if (!team.members.includes(memberId)) team.members.push(memberId);
      team.admin = team.admin.filter(
        (id) => id.toString() !== memberId.toString()
      );
    }
    member.role = role;
  }

  await team.save();
  await member.save();

  res
    .status(200)
    .json({ message: "Team member details updated successfully", member });
});

export const removeTeammate = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const adminId = req.user._id;

  const adminUser = await User.findById(adminId);
  if (!adminUser || adminUser.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Only an admin can remove team members." });
  }

  const team = await Team.findOne({ admin: adminId });
  if (!team) {
    return res.status(404).json({ message: "Team not found." });
  }

  const member = await User.findById(memberId);
  if (!member) {
    return res.status(404).json({ message: "User not found." });
  }

  if (!team.members.includes(memberId)) {
    return res.status(400).json({ message: "User is not a team member." });
  }

  team.members = team.members.filter(
    (id) => id.toString() !== memberId.toString()
  );
  await team.save();

  member.role = "user";
  member.team = null;
  member.invitedBy = null;
  await member.save();

  res.status(200).json({ message: "Teammate removed successfully." });
});
