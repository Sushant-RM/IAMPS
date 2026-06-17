function cleanData(data) {
  // 1. Remove entries with missing or invalid titles
  const validData = data.filter(item => item && item.title && item.title.trim() !== "" && item.title.toLowerCase() !== "undefined");

  // 2. Remove duplicates (same title and year)
  const uniqueData = [];
  const seen = new Set();
  
  for (const item of validData) {
    // Ensure year is valid, fallback to current year
    let year = parseInt(item.year, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      year = new Date().getFullYear();
    }
    item.year = year;

    const key = `${item.title.toLowerCase()}-${item.year}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueData.push(item);
    }
  }

  return uniqueData;
}

function enrichPublication(item) {
  const title = item.title;
  const titleLower = title.toLowerCase();
  let description = item.description && item.description.toLowerCase() !== "undefined" ? item.description.trim() : "";

  // Check if description is missing or generic
  const isGeneric = description === "" || 
                    description.toLowerCase().includes("achieved measurable outcomes") ||
                    description.toLowerCase() === "demonstrated: . achieved measurable outcomes." ||
                    description.length < 15;

  if (isGeneric) {
    if (titleLower.includes("ai") || titleLower.includes("artificial intelligence")) {
      description = `Published research on artificial intelligence, focusing on innovative methodologies and applications to solve complex problems.`;
    } else if (titleLower.includes("ml") || titleLower.includes("machine learning")) {
      description = `Conference publication on machine learning techniques applied to real-world datasets with focus on performance optimization.`;
    } else if (titleLower.includes("data") || titleLower.includes("database")) {
      description = `Presented findings on data management and optimization techniques, contributing to efficient large-scale information systems.`;
    } else {
      description = `Authored and published research findings contributing to the academic discourse in the respective field of study.`;
    }
  }

  // Ensure professional formatting
  if (description.startsWith("•") || description.startsWith("-")) {
    description = description.substring(1).trim();
  }
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    ...item,
    description
  };
}

function enrichEvent(item) {
  const title = item.title;
  const titleLower = title.toLowerCase();
  let description = item.description && item.description.toLowerCase() !== "undefined" ? item.description.trim() : "";

  // Check if description is missing or generic
  const isGeneric = description === "" || 
                    description.toLowerCase().includes("achieved measurable outcomes") ||
                    description.toLowerCase() === "demonstrated: . achieved measurable outcomes." ||
                    description.length < 15;

  if (isGeneric) {
    if (titleLower.includes("hackathon")) {
      description = `Participated in an intensive hackathon, collaborating with a team to rapidly prototype and deliver innovative software solutions.`;
    } else if (titleLower.includes("conference") || titleLower.includes("seminar")) {
      description = `Attended professional conference to engage with industry experts, expanding domain knowledge and networking with peers.`;
    } else if (titleLower.includes("workshop")) {
      description = `Completed an interactive workshop focused on practical skill development and applied technical methodologies.`;
    } else {
      description = `Actively participated in professional development activities, demonstrating continuous learning and engagement with the broader community.`;
    }
  }

  // Ensure professional formatting
  if (description.startsWith("•") || description.startsWith("-")) {
    description = description.substring(1).trim();
  }
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    ...item,
    description
  };
}

function formatData(data) {
  const cleanedData = cleanData(data);

  // 1. Separate Publications (Research / Papers)
  const publications = cleanedData
    .filter(d => d.type === "paper" || d.category === "Research" || d.category === "Academic")
    .map(p => enrichPublication(p));

  // Store lowercase publication titles to prevent duplication in events
  const publicationTitles = new Set(publications.map(p => p.title.trim().toLowerCase()));

  // 2. Separate Events (Achievements / Activities) excluding any publication titles
  const events = cleanedData
    .filter(d => d.type === "event" || (d.type !== "paper" && d.category !== "Research" && d.category !== "Academic"))
    .filter(e => !publicationTitles.has(e.title.trim().toLowerCase()))
    .map(e => enrichEvent(e));

  return {
    publications,
    events
  };
}

module.exports = formatData;
