const safeParseJSON = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("safeParseJSON failed. Raw output:", raw);
    return null; // return null instead of crashing
  }
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
  "score": <integer between 0 and 100, no quotes>,
  "reason": "<1-2 sentence explanation of the score>"
}
No markdown, no extra fields. The score must be a plain number, not a string.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  });

  const raw = response.choices[0].message.content;
  console.log("scoreSkillMatch raw response:", raw); // debug log

  const parsed = safeParseJSON(raw);

  return {
    score: parsed?.score != null ? Number(parsed.score) : 0, // force to Number, fallback 0
    reason: parsed?.reason || "Could not determine match reason.",
  };
};