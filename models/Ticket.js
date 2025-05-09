import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  messages: [
    {
      senderName: {
        type: String,
        required: true,
      },
      senderPhone: {
        type: Number,
        required: true,
      },
      senderEmail: {
        type: String,
        required: true,
      },
      message: [
        {
          type: String,
          required: true,
        },
      ],
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },

  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["unresolved", "resolved"],
    default: "unresolved",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Ticket", ticketSchema);
