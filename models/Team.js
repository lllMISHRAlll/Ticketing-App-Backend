import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  admin: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  pendingInvites: [
    {
      email: { type: String },
      name: { type: String },
      role: {
        type: String,
        enum: ["admin", "teammember"],
        default: "teammember",
      },
    },
  ],
});

export default mongoose.model("Team", teamSchema);
