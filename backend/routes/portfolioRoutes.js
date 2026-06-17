const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { authMiddleware } = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const Achievement = require("../models/Achievement");
const Paper = require("../models/Paper");
const aiEnhancer = require("../services/aiEnhancer");
const formatData = require("../utils/formatter");
const renderTemplate = require("../utils/templateEngine");
const { buildPortfolioSections } = require("../utils/portfolioSections");
const generatePDF = require("../utils/pdfGenerator");
const generateDocx = require("../utils/docxGenerator");
const { anonymizeName } = require("../utils/anonymizer");

let placementCache = {};
try {
  const raw = fs.readFileSync(
    path.join(__dirname, '../../datasets/placementdata.csv'), 'utf8'
  );
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',');
  lines.slice(1).forEach(line => {
    const cols = line.split(',');
    const id = cols[0]?.trim();
    if (id) {
      const record = {};
      headers.forEach((h, i) => record[h.trim()] = cols[i]?.trim());
      placementCache[id] = record;
    }
  });
  console.log(`[Portfolio] Placement cache loaded: ${Object.keys(placementCache).length} records`);
} catch (e) {
  console.warn('[Portfolio] placementdata.csv not found, placement data will be skipped.');
}

// Utility to fetch from cache for the student
function getPlacementMetrics(userIdStr) {
  try {
    // Hash userId to 1-10000 deterministically
    let hash = 0;
    for (let i = 0; i < userIdStr.length; i++) {
      hash = ((hash << 5) - hash) + userIdStr.charCodeAt(i);
      hash |= 0;
    }
    const studentIdTarget = Math.abs(hash % 10000) + 1;
    
    const record = placementCache[String(studentIdTarget)];
    if (record) {
      return {
        internships: record['Internships'],
        projects: record['Projects'],
        workshops: record['Workshops/Certifications'],
        aptitudeScore: record['AptitudeTestScore'],
        softSkills: record['SoftSkillsRating'],
        placementTraining: record['PlacementTraining'],
        placementStatus: record['PlacementStatus'] ? record['PlacementStatus'].trim() : ""
      };
    }
  } catch (err) {
    console.error("Dataset Error:", err);
  }
  return null;
}


// Helper to extract student profile extra data (skills, CGPA, dataset metrics) from database
async function getProfileExtraData(userId) {
  // FIX 3: pull skills and cgpa from User document — no hardcoded defaults
  let skills = [];
  let cgpa = 'N/A';
  try {
    const user = await User.findById(userId);
    if (user) {
      if (Array.isArray(user.skills) && user.skills.length > 0) {
        skills = user.skills;
      }
      if (user.cgpa) {
        cgpa = user.cgpa;
      }
    }
  } catch (e) {
    console.log("Error fetching user profile data:", e.message);
  }
  const placementMetrics = getPlacementMetrics(userId);
  return { skills, cgpa, placementMetrics };
}

// Safely fetch career insights and internship matches from Python FastAPI service (port 8000)
async function getFastAPICareerAnalytics(userId, skills, department) {
  try {
    let hash = 0;
    const userIdStr = String(userId);
    for (let i = 0; i < userIdStr.length; i++) {
      hash = ((hash << 5) - hash) + userIdStr.charCodeAt(i);
      hash |= 0;
    }
    const studentIdTarget = Math.abs(hash % 10000) + 1;

    let targetDomain = "Software";
    if (department && (department.toLowerCase().includes("cse") || department.toLowerCase().includes("computer") || department.toLowerCase().includes("ai") || department.toLowerCase().includes("data"))) {
      targetDomain = "AI/ML/Data";
    }

    const payload = {
      student_id: studentIdTarget,
      skills: skills && skills.length > 0 ? skills : ["python", "javascript", "problem solving"],
      target_domain: targetDomain
    };

    const response = await axios.post("http://127.0.0.1:8000/api/v1/recommend/dashboard", payload, { timeout: 3000 });
    return response.data;
  } catch (err) {
    console.log("[Portfolio] FastAPI Recommender offline, skipping enriched career insights:", err.message);
    return null;
  }
}

// ==========================================
// POST /generate - Generate full AI portfolio
// ==========================================
router.post("/generate", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio: draftBio, headline: draftHeadline, careerObjective: draftCareerObj, skillsSummary: draftSkills } = req.body;

    // 1. Fetch live user details
    const user = await User.findById(userId).populate("departmentId");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 2. Fetch approved achievements
    const achQuery = { status: "approved" };
    if (user.usn) {
      achQuery.usn = user.usn;
    } else {
      achQuery.studentName = user.fullName;
    }
    const rawAchievements = await Achievement.find(achQuery);

    // 3. Fetch approved papers
    const rawPapers = await Paper.find({ submittedBy: userId, status: "approved" });

    // 4. Retrieve student profile details (skills, cgpa, dataset)
    const { skills, cgpa, placementMetrics } = await getProfileExtraData(userId);

    let datasetInfo = "Dataset metrics unavailable.";
    if (placementMetrics) {
      datasetInfo = `Internships: ${placementMetrics.internships}, Projects: ${placementMetrics.projects}, Workshops: ${placementMetrics.workshops}, Soft Skills Rating: ${placementMetrics.softSkills}/5.`;
    }

    // 5. Structure studentData for AI
    const studentData = {
      name: anonymizeName(user.email, user.fullName),
      department: user.departmentId ? user.departmentId.name : "Computer Science",
      cgpa: cgpa,
      skills: skills,
      datasetMetrics: datasetInfo,
      achievements: rawAchievements.map(a => ({
        title: a.achievementTitle || a.title || "Achievement",
        category: a.category || "Extra-curricular",
        description: a.description || ""
      })),
      papers: rawPapers.map(p => ({
        title: p.title,
        abstract: p.abstract || p.summary || ""
      }))
    };

    // 6. Generate AI professional fields using optional drafts
    const { bio, headline, skillsSummary, careerObjective } = await aiEnhancer.generatePortfolioSections(studentData, { draftBio, draftHeadline, draftCareerObj, draftSkills });

    // 7. Structure achievements & papers collections for database storage
    const achievementsDbList = rawAchievements.map(a => ({
      title: a.achievementTitle || a.title || "Achievement",
      category: a.category || "Extra-curricular",
      description: a.description || "",
      year: a.achievementDate ? new Date(a.achievementDate).getFullYear() : new Date().getFullYear()
    }));

    const papersDbList = rawPapers.map(p => ({
      title: p.title,
      abstract: p.abstract || p.summary || "",
      year: p.year || new Date().getFullYear()
    }));

    // 8. Find or create portfolio for student
    let portfolio = await Portfolio.findOne({ studentId: userId });
    if (!portfolio) {
      portfolio = new Portfolio({ studentId: userId });
    }

    portfolio.bio = bio;
    portfolio.headline = headline;
    portfolio.careerObjective = careerObjective;
    portfolio.skillsSummary = skillsSummary;
    portfolio.achievements = achievementsDbList;
    portfolio.papers = papersDbList;
    portfolio.fileName = "portfolio.pdf";

    await portfolio.save();

    res.status(200).json({ 
      success: true, 
      data: { 
        ...portfolio.toObject(), 
        studentName: anonymizeName(user.email, user.fullName),
        email: user.email,
        usn: user.usn || "N/A",
        department: user.departmentId ? user.departmentId.name : "Computer Science",
        skills,
        cgpa,
        datasetMetrics: placementMetrics,
        careerAnalytics: await getFastAPICareerAnalytics(userId, skills, user.departmentId ? user.departmentId.name : "")
      } 
    });
  } catch (err) {
    console.error("PORTFOLIO GENERATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /me - Fetch current student's saved portfolio
// ==========================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("departmentId");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const portfolio = await Portfolio.findOne({ studentId: userId });
    const { skills, cgpa, placementMetrics } = await getProfileExtraData(userId);
    const careerAnalytics = await getFastAPICareerAnalytics(userId, skills, user.departmentId ? user.departmentId.name : "");

    if (!portfolio) {
      // Fetch raw data for pre-generation preview
      const achQuery = { status: "approved" };
      if (user.usn) achQuery.usn = user.usn;
      else achQuery.studentName = user.fullName;
      
      const rawAchievements = await Achievement.find(achQuery);
      const rawPapers = await Paper.find({ submittedBy: userId, status: "approved" });

      return res.status(200).json({
        isNew: true,
        studentName: anonymizeName(user.email, user.fullName),
        email: user.email,
        usn: user.usn || "N/A",
        department: user.departmentId ? user.departmentId.name : "Computer Science",
        skills,
        cgpa,
        achievements: rawAchievements.map(a => ({
          title: a.achievementTitle || a.title || "Achievement",
          category: a.category || "Extra-curricular",
          description: a.description || "",
          year: a.achievementDate ? new Date(a.achievementDate).getFullYear() : new Date().getFullYear()
        })),
        papers: rawPapers.map(p => ({
          title: p.title,
          abstract: p.abstract || p.summary || "",
          year: p.year || new Date().getFullYear()
        })),
        datasetMetrics: placementMetrics,
        careerAnalytics
      });
    }

    res.status(200).json({
      ...portfolio.toObject(),
      studentName: anonymizeName(user.email, user.fullName),
      email: user.email,
      usn: user.usn || "N/A",
      department: user.departmentId ? user.departmentId.name : "Computer Science",
      skills,
      cgpa,
      datasetMetrics: placementMetrics,
      careerAnalytics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PUT /me - Update editable fields
// ==========================================
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, headline, careerObjective, skillsSummary, theme } = req.body;

    let portfolio = await Portfolio.findOne({ studentId: userId });
    if (!portfolio) {
      portfolio = new Portfolio({ studentId: userId });
    }

    if (bio !== undefined) portfolio.bio = bio;
    if (headline !== undefined) portfolio.headline = headline;
    if (careerObjective !== undefined) portfolio.careerObjective = careerObjective;
    if (skillsSummary !== undefined) portfolio.skillsSummary = skillsSummary;
    if (theme !== undefined) portfolio.theme = theme;

    await portfolio.save();

    const user = await User.findById(userId).populate("departmentId");
    const { skills, cgpa, placementMetrics } = await getProfileExtraData(userId);

    res.status(200).json({
      success: true,
      data: {
        ...portfolio.toObject(),
        studentName: user ? anonymizeName(user.email, user.fullName) : "Student",
        email: user ? user.email : "",
        usn: user ? (user.usn || "N/A") : "N/A",
        department: user && user.departmentId ? user.departmentId.name : "Computer Science",
        skills,
        cgpa,
        datasetMetrics: placementMetrics
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// POST /enhance - Polish a specific section
// ==========================================
router.post("/enhance", authMiddleware, async (req, res) => {
  try {
    const { text, fieldName } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text content is required." });
    }
    if (!fieldName) {
      return res.status(400).json({ error: "FieldName is required." });
    }

    const enhanced = await aiEnhancer.enhanceSection(text, fieldName);
    res.status(200).json({ success: true, data: enhanced });
  } catch (err) {
    console.error("SECTION ENHANCEMENT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /export/pdf - Export as PDF
// ==========================================
router.get("/export/pdf", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await Portfolio.findOne({ studentId: userId });
    if (!portfolio) {
      return res.status(404).json({ error: "Please generate your portfolio first." });
    }

    const user = await User.findById(userId).populate("departmentId");
    const liveName = user ? anonymizeName(user.email, user.fullName) : "Student Name";
    const { skills, cgpa } = await getProfileExtraData(userId);
    const careerAnalytics = await getFastAPICareerAnalytics(
      userId,
      skills,
      user?.departmentId ? user.departmentId.name : ""
    );

    // Clean & map raw documents to publications and events lists
    const rawData = [
      ...portfolio.papers.map(p => ({ ...p.toObject(), type: "paper", year: p.year || new Date().getFullYear() })),
      ...portfolio.achievements.map(a => ({ ...a.toObject(), type: "event", year: a.year || new Date().getFullYear() }))
    ];
    const formatted = formatData(rawData);
    const sections = buildPortfolioSections(formatted);

    // Compile dynamic HTML template
    const templateType = portfolio.theme || "professional";
    let templatePath = path.join(__dirname, `../templates/${templateType}.html`);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(__dirname, "../templates/professional.html");
    }

    const template = fs.readFileSync(templatePath, "utf-8");
    const html = renderTemplate(template, {
      name: liveName,
      email: user?.email || "",
      usn: user?.usn || "N/A",
      department: user?.departmentId ? user.departmentId.name : "Computer Science",
      university: "University",
      cgpa,
      skills: skills || [],
      careerAnalytics,
      researchInterests: portfolio.headline,
      bio: portfolio.bio,
      headline: portfolio.headline,
      careerObjective: portfolio.careerObjective,
      skillsSummary: portfolio.skillsSummary,
      theme: templateType,
      ...sections
    });

    // FIX 1: per-user unique temp file — no race condition
    const filepath = await generatePDF(html, userId);

    res.download(filepath, `${liveName.replace(/\s+/g, '_')}_Portfolio.pdf`, (err) => {
      // Delete temp file after download completes (success or failure)
      try { fs.unlinkSync(filepath); } catch (_) {}
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (err) {
    console.error("PDF EXPORT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// GET /export/docx - Export as DOCX
// ==========================================
router.get("/export/docx", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await Portfolio.findOne({ studentId: userId });
    if (!portfolio) {
      return res.status(404).json({ error: "Please generate your portfolio first." });
    }

    const user = await User.findById(userId);
    const liveName = user ? anonymizeName(user.email, user.fullName) : "Student Name";

    // Clean & map documents to publications and events lists
    const rawData = [
      ...portfolio.papers.map(p => ({ ...p.toObject(), type: "paper", year: p.year || new Date().getFullYear() })),
      ...portfolio.achievements.map(a => ({ ...a.toObject(), type: "event", year: a.year || new Date().getFullYear() }))
    ];
    const formatted = formatData(rawData);

    const { cgpa } = await getProfileExtraData(userId);

    // Compile Word document binary — per-user unique temp file (no race condition)
    const docxPath = await generateDocx({
      name: liveName,
      email: user.email,
      usn: user.usn || "N/A",
      department: user.departmentId ? user.departmentId.name : "Computer Science",
      cgpa: cgpa,
      bio: portfolio.bio,
      headline: portfolio.headline,
      careerObjective: portfolio.careerObjective,
      skillsSummary: portfolio.skillsSummary,
      skills: user.skills || [],
      ...formatted
    }, userId);

    res.download(docxPath, `${liveName.replace(/\s+/g, '_')}_Portfolio.docx`, (err) => {
      // Delete temp file after download completes (success or failure)
      try { fs.unlinkSync(docxPath); } catch (_) {}
      if (err && !res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (err) {
    console.error("DOCX EXPORT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
