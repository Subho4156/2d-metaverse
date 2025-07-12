const mongoose= require('mongoose');

const spaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  mapKey: {
    type: String,
    required: true,
    enum: ["office", "spacestation"],
    default: "office"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Space", spaceSchema);