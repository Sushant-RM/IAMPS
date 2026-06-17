const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  bio: {
    type: String,
    default: ""
  },
  headline: {
    type: String,
    default: ""
  },
  careerObjective: {
    type: String,
    default: ""
  },
  skillsSummary: {
    type: String,
    default: ""
  },
  theme: {
    type: String,
    default: "professional",
    enum: ["professional", "academic", "minimal", "modern", "executive", "creative"]
  },
  achievements: [{
    title: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    year: { type: Number }
  }],
  papers: [{
    title: { type: String, required: true },
    abstract: { type: String },
    year: { type: Number }
  }],
  fileName: {
    type: String,
    default: "portfolio.pdf"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);
