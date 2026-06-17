const AI_MODEL = "llama-3.1-8b-instant";
const axios = require("axios");
const { getCached, setCache } = require("./cache");

const API_KEY = process.env.GROQ_API_KEY;



// ==========================================
// LOCAL FALLBACK GENERATORS (DYNAMIC PATTERNS)
// ==========================================

function hasSubstantialContent(text) {
  if (!text || typeof text !== "string") return false;

  const words = text.trim().split(/\s+/).filter(Boolean);

  return words.length >= 40;
}

function localEnhance(text) {
  return `Developed and executed: ${text}, delivering measurable project outcomes.`;
}

function localBio(data) {
  const name = data.name || "The candidate";
  const dept = data.department || "Engineering";
  const skillsStr = data.skills && data.skills.length > 0 ? data.skills.slice(0, 4).join(", ") : "technical development";
  const achsStr = data.achievements && data.achievements.length > 0 ? `including ${data.achievements[0].title}` : "in extracurricular domains";
  return `${name} is a highly motivated and academically accomplished student specializing in ${dept}, maintaining a strong CGPA of ${data.cgpa || '9.0'}. They possess extensive practical skills in ${skillsStr}, showing robust expertise in problem-solving and project implementation. With a diverse record of successful achievements, ${achsStr}, they are committed to applying technical expertise in dynamic environments to deliver high-quality solutions.`;
}

function localHeadline(data) {
  const dept = data.department || "Engineering";
  const firstSkills = data.skills && data.skills.length > 0 ? data.skills.slice(0, 3).join(" | ") : "Software Development";
  return `Aspiring ${dept} Professional | Specializing in ${firstSkills}`;
}

function localSkillsSummary(data) {
  const skillsStr = data.skills && data.skills.length > 0 ? data.skills.join(", ") : "full-stack development methodologies";
  const dept = data.department || "Engineering";
  return `Highly proficient in ${skillsStr}, showcasing versatile technical capabilities within the ${dept} ecosystem. Adept at transforming complex requirements into functional, scalable software, with strong competency in collaborative workflows and modular design.`;
}

function localCareerObjective(data) {
  const dept = data.department || "Engineering";
  const skillsStr = data.skills && data.skills.length > 0 ? data.skills.slice(0, 3).join(", ") : "industry-standard technologies";
  return `Seeking a challenging position in a professional organization where I can leverage my academic background in ${dept} and expertise in ${skillsStr}. Aiming to contribute to innovative projects while continuously learning and growing alongside a high-performing technical team.`;
}

// ==========================================
// OPENAI API CONNECTIVITY WRAPPERS
// ==========================================

async function callGroq(systemPrompt, userPrompt, fallbackFn, dataOrText) {
  if (!API_KEY || API_KEY === 'none') {
    return fallbackFn(dataOrText);
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Groq call failed, utilizing local fallback:", err.message);
    return fallbackFn(dataOrText);
  }
}

// ==========================================
// PRIMARY EXPORTED FUNCTIONS
// ==========================================

async function enhanceText(text) {
  const cacheKey = `enhance_${text}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const system = "Rewrite this as a strong, professional resume bullet point using action verbs:";
  const user = text;

  const result = await callGroq(system, user, localEnhance, text);
  setCache(cacheKey, result);
  return result;
}

function generateBio(studentData, userBio = "") {
  if (hasSubstantialContent(userBio)) {
    return userBio.trim();
  }
  return localBio(studentData);
}

function generateHeadline(studentData, userHeadline = "") {
  if (hasSubstantialContent(userHeadline)) {
    return userHeadline.trim();
  }
  return localHeadline(studentData);
}

function generateSkillsSummary(studentData, userSkills = "") {
  if (hasSubstantialContent(userSkills)) {
    return userSkills.trim();
  }
  return localSkillsSummary(studentData);
}

function generateCareerObjective(studentData, userObjective = "") {
  if (hasSubstantialContent(userObjective)) {
    return userObjective.trim();
  }
  return localCareerObjective(studentData);
}

async function generatePortfolioSections(studentData, drafts = {}) {
  const { draftBio, draftHeadline, draftCareerObj, draftSkills } = drafts;

  const draftContext = [];
  const refineInstructions = [];

  // Objective 3: Validate drafts and determine whether to refine or generate fresh
  if (hasSubstantialContent(draftBio)) {
    draftContext.push(`Bio Draft to refine: "${draftBio}"`);
    refineInstructions.push(`- For the "bio" field: Refine and professionalize the provided Bio Draft. Make it a polished 3-4 sentence professional summary.`);
  } else {
    refineInstructions.push(`- For the "bio" field: Generate a brand new, compelling 3-4 sentence professional bio from scratch using the student data. Ignore any short, weak, or placeholder drafts.`);
  }

  if (hasSubstantialContent(draftHeadline)) {
    draftContext.push(`Headline Draft to refine: "${draftHeadline}"`);
    refineInstructions.push(`- For the "headline" field: Refine the provided Headline Draft into a strong, 1-line professional resume header.`);
  } else {
    refineInstructions.push(`- For the "headline" field: Generate a brand new 1-line resume header from scratch based on the student's skills.`);
  }

  if (hasSubstantialContent(draftCareerObj)) {
    draftContext.push(`Career Objective Draft to refine: "${draftCareerObj}"`);
    refineInstructions.push(`- For the "careerObjective" field: Refine the provided Career Objective Draft into a professional 2-3 sentence statement.`);
  } else {
    refineInstructions.push(`- For the "careerObjective" field: Generate a brand new 2-3 sentence career objective from scratch using the student data.`);
  }

  if (hasSubstantialContent(draftSkills)) {
    draftContext.push(`Skills Draft to refine: "${draftSkills}"`);
    refineInstructions.push(`- For the "skillsSummary" field: Refine the provided Skills Draft into a cohesive paragraph of technical expertise.`);
  } else {
    refineInstructions.push(`- For the "skillsSummary" field: Generate a brand new skills paragraph summarizing their core technical capabilities.`);
  }

  const prompt = `
    You are a professional resume writer. Given the student data below, generate four sections.
    Respond ONLY with a raw JSON object. Do NOT include markdown code blocks, do NOT wrap the response in backticks, and do NOT include any introductory or concluding text.

    Student Data:
    ${JSON.stringify(studentData, null, 2)}

    ${draftContext.length > 0 ? `User Drafts:\n${draftContext.join('\n')}` : ''}

    Instructions:
    ${refineInstructions.join('\n')}

    Response JSON Structure (strict):
    {
      "bio": "3-4 sentence professional summary",
      "headline": "1-line resume header",
      "careerObjective": "2-3 sentence career objective",
      "skillsSummary": "concise skills paragraph"
    }
  `;

  try {
    if (!API_KEY || API_KEY === 'none') throw new Error("No API key");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }, // Enable Groq JSON mode
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    const result = JSON.parse(raw);

    const parsedBio = result.bio || result.professionalSummary || result.summary || "";
    const parsedHeadline = result.headline || result.title || "";
    const parsedObjective = result.careerObjective || result.career_objective || result.objective || "";
    const parsedSkills = result.skillsSummary || result.skills_summary || result.skills || "";

    return {
      bio: parsedBio.trim() || generateBio(studentData, draftBio),
      headline: parsedHeadline.trim() || generateHeadline(studentData, draftHeadline),
      careerObjective: parsedObjective.trim() || generateCareerObjective(studentData, draftCareerObj),
      skillsSummary: parsedSkills.trim() || generateSkillsSummary(studentData, draftSkills)
    };
  } catch (err) {
    console.error("AI call failed or parse failed, utilizing local fallback:", err.message);
    return {
      bio: generateBio(studentData, draftBio),
      headline: generateHeadline(studentData, draftHeadline),
      careerObjective: generateCareerObjective(studentData, draftCareerObj),
      skillsSummary: generateSkillsSummary(studentData, draftSkills)
    };
  }
}


async function generateProjectDescription(project) {
  if (!project) return "Developed a technical project demonstrating practical implementation skills.";

  const cacheKey = `project_desc_${project._id || project.title || ''}_${project.description || ''}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const system = "Rewrite this project description as a strong, professional resume bullet point using action verbs. Focus on technical achievements and results. Start with an action verb and keep it to 1-2 impactful sentences.";
  const user = `Project: ${project.title}. Description: ${project.description || project.abstract || 'a technical project demonstrating practical implementation skills.'}`;

  const localProjectFallback = (p) => {
    return `Developed ${p.title} — ${p.description || p.abstract || 'a technical project demonstrating practical implementation skills.'}`;
  };

  const result = await callGroq(system, user, localProjectFallback, project);
  setCache(cacheKey, result);
  return result;
}

async function enhanceSection(text, fieldName) {
  if (!text || text.trim().length === 0) return "";

  let systemPrompt = "You are a professional resume writer and career coach.";
  let userPrompt = "";
  const fallbackFn = (t) => t;

  if (fieldName === 'bio') {
    systemPrompt = "You are a professional editor. Rewrite and polish this student resume bio. Make it a highly compelling, professional 3-4 sentence summary. Maintain a confident, professional, and clear tone.";
    userPrompt = `Polish this bio:\n"${text}"`;
  } else if (fieldName === 'headline') {
    systemPrompt = "You are a professional editor. Rewrite and polish this student resume headline. It must be a strong, impactful 1-line headline summarizing key skills and academic focus. Keep it under 80 characters.";
    userPrompt = `Polish this headline:\n"${text}"`;
  } else if (fieldName === 'careerObjective') {
    systemPrompt = "You are a professional editor. Rewrite and polish this student career objective. Make it a professional 2-3 sentence statement showing ambition, alignment with industry standards, and academic drive.";
    userPrompt = `Polish this career objective:\n"${text}"`;
  } else if (fieldName === 'skillsSummary') {
    systemPrompt = "You are a professional editor. Rewrite and polish this student skills summary. Combine the skills into a cohesive, grammatically perfect, and professional paragraph emphasizing technical competency.";
    userPrompt = `Polish this skills summary:\n"${text}"`;
  } else {
    systemPrompt = "You are a professional editor. Rewrite and polish this resume section to be highly professional and impactful.";
    userPrompt = `Polish this text:\n"${text}"`;
  }

  return await callGroq(systemPrompt, userPrompt, fallbackFn, text);
}

module.exports = {
  enhanceText,
  generateBio,
  generateHeadline,
  generateSkillsSummary,
  generateCareerObjective,
  generateProjectDescription,
  generatePortfolioSections,
  enhanceSection
};
