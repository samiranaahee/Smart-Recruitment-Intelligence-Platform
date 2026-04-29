const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const safeParseJSON = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("safeParseJSON failed. Raw output:", raw);
    return null;
  }
};

const extractSkills = async (resumeText) => {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You are a technical recruiter. Extract a list of skills from the resume. Include technical skills, tools, frameworks, languages, and soft skills. Return ONLY a valid JSON array of strings. No explanation, no markdown.",
      },
      { role: "user", content: resumeText },
    ],
  });
  return safeParseJSON(response.choices[0].message.content) || [];
};

const scoreSkillMatch = async (resumeText, jobDescription, candidateStatement = "") => {
  const candidateProfile = candidateStatement
    ? `${resumeText}\n\nCANDIDATE STATEMENT:\n${candidateStatement}`
    : resumeText;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `You are an expert recruiter. Score how well the candidate matches the job requirements.
Consider their resume and any personal statement they provide.
Return ONLY a valid JSON object:
{
  "score": <integer 0-100>,
  "reason": "<1-2 sentence explanation>"
}
No markdown, no extra fields. Score must be a plain number.`,
      },
      {
        role: "user",
        content: `CANDIDATE PROFILE:\n${candidateProfile}\n\nJOB REQUIREMENTS:\n${jobDescription}`,
      },
    ],
  });

  const parsed = safeParseJSON(response.choices[0].message.content);
  return {
    score:  parsed?.score  != null ? Number(parsed.score) : 0,
    reason: parsed?.reason || "Could not determine match reason.",
  };
};

const analyzeSkillGap = async (resumeText, jobDescription, candidateStatement = "") => {
  const candidateProfile = candidateStatement
    ? `${resumeText}\n\nCANDIDATE STATEMENT:\n${candidateStatement}`
    : resumeText;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You are a career advisor. Compare the candidate's profile to the job requirements.
Return ONLY a valid JSON object:
{
  "missingSkills": ["skill1", "skill2"],
  "explanation": "<paragraph explaining the gaps>"
}
No markdown, no extra fields.`,
      },
      {
        role: "user",
        content: `CANDIDATE PROFILE:\n${candidateProfile}\n\nJOB REQUIREMENTS:\n${jobDescription}`,
      },
    ],
  });

  const parsed = safeParseJSON(response.choices[0].message.content);
  return {
    missingSkills: parsed?.missingSkills || [],
    explanation:   parsed?.explanation  || "",
  };
};

const generateCandidateSummary = async (resumeText, candidateStatement = "") => {
  const candidateProfile = candidateStatement
    ? `${resumeText}\n\nCANDIDATE STATEMENT:\n${candidateStatement}`
    : resumeText;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a senior recruiter. Write a professional 3-4 sentence candidate summary. Highlight key strengths, experience, and skills. Write in third person. Return only plain text, no markdown.",
      },
      { role: "user", content: candidateProfile },
    ],
  });
  return response.choices[0].message.content.trim();
};

module.exports = {
  extractSkills,
  scoreSkillMatch,
  analyzeSkillGap,
  generateCandidateSummary,
};