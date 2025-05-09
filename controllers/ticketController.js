import asyncHandler from "../middleware/asyncHandler.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Team from "../models/Team.js";

export const getTickets = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const skip = (page - 1) * limit;

  const user = await User.findById(userId).populate("team");
  const teammates = user.team ? user.team.members : [];
  const userAndTeamIds = [
    ...new Set([userId.toString(), ...teammates.map((id) => id.toString())]),
  ];

  let query = {
    team: user.team?._id,
  };

  if (status) {
    query.status = status;
  }

  if (search) {
    query["messages.message"] = {
      $elemMatch: { $regex: search, $options: "i" },
    };
  }

  const tickets = await Ticket.find(query)
    .skip(skip)
    .limit(limit)
    .populate("assignedTo", "name email");

  const count = await Ticket.countDocuments(query);

  res.json({
    tickets,
    page: Number(page),
    pages: Math.ceil(count / limit),
    count,
  });
});

export const createCompleteTicket = asyncHandler(async (req, res) => {
  const { senderName, senderPhone, senderEmail, message } = req.body;

  if (!senderName || !senderPhone || !senderEmail || !message) {
    res.status(400);
    throw new Error(
      "All fields (senderName, senderPhone, senderEmail, message) are required"
    );
  }

  if (isNaN(senderPhone)) {
    res.status(400);
    throw new Error("Phone number must be numeric");
  }

  let assignedTo = null;
  let teamId = null;

  if (req.user) {
    const team = await Team.findById(req.user.team).populate("admin");

    if (!team) {
      res.status(404);
      throw new Error("User's team not found");
    }

    assignedTo = team.admin._id;
    teamId = team._id;
  } else {
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      res.status(404);
      throw new Error(
        "No admin user found to assign ticket. Please try again Later"
      );
    }

    const team = await Team.findOne({ admin: adminUser._id });
    if (!team) {
      res.status(404);
      throw new Error("No team found for the admin");
    }

    assignedTo = adminUser._id;
    teamId = team._id;
  }

  const currentYear = new Date().getFullYear();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const lastTicketToday = await Ticket.findOne({
    createdAt: {
      $gte: todayStart,
      $lt: todayEnd,
    },
  }).sort({ createdAt: -1 });

  let ticketNumber;
  if (lastTicketToday) {
    const lastTicketIdParts = lastTicketToday.ticketId.split("-");
    const lastX = parseInt(lastTicketIdParts[1].charAt(0));
    ticketNumber = `${currentYear}-${lastX + 1}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(currentYear).slice(-2)}`;
  } else {
    ticketNumber = `${currentYear}-0${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(currentYear).slice(-2)}`;
  }

  const formattedMessage = {
    senderName,
    senderPhone: Number(senderPhone),
    senderEmail,
    message: [message],
    timestamp: new Date(),
  };

  const ticket = await Ticket.create({
    messages: [formattedMessage],
    assignedTo,
    team: teamId,
    status: "unresolved",
    ticketId: ticketNumber,
  });

  res.status(201).json(ticket);
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }

  ticket.status = status;
  if (status === "resolved") {
    ticket.resolvedAt = new Date();
  }

  await ticket.save();

  res.json(ticket);
});

export const assignTicket = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (assignedTo) {
    const teamMember = await User.findById(assignedTo);
    if (!teamMember) {
      return res.status(404).json({ message: "Team member not found" });
    }
    ticket.assignedTo = assignedTo;
    await ticket.save();
    return res.status(200).json(ticket);
  }

  const team = await Team.findOne({ admin: { $ne: [] } });

  if (team && team.admin.length > 0) {
    ticket.assignedTo = team.admin[0];
    await ticket.save();
    return res.status(200).json(ticket);
  }

  res.status(400).json({ message: "No admins available to assign the ticket" });
});
