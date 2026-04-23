const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const safeParseJSON = (raw) => {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
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
      {
        role: "user",
        content: resumeText,
      },
    ],
  });

  return safeParseJSON(response.choices[0].message.content);
};

const scoreSkillMatch = async (resumeText, jobDescription) => {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `You are an expert recruiter. Given a resume and a job description, evaluate the match.
Return ONLY a valid JSON object with exactly these fields:
{
  "score": <number 0-100>,
  "reason": "<1-2 sentence explanation of the score>"
}
No markdown, no extra fields.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  });

  return safeParseJSON(response.choices[0].message.content);
};

const analyzeSkillGap = async (resumeText, jobDescription) => {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You are a career advisor. Compare the candidate's resume to the job description.
Return ONLY a valid JSON object with exactly these fields:
{
  "missingSkills": ["skill1", "skill2"],
  "explanation": "<paragraph explaining the gaps and how critical they are>"
}
No markdown, no extra fields.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  });

  return safeParseJSON(response.choices[0].message.content);
};

const generateCandidateSummary = async (resumeText) => {
  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content:
          "You are a senior recruiter. Write a professional 3-4 sentence candidate summary based on this resume. Be specific, highlight key strengths, years of experience, and top skills. Write in third person. Return only plain text, no markdown.",
      },
      {
        role: "user",
        content: resumeText,
      },
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