const pdfParse = require("pdf-parse");

const parseResume = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (err) {
    console.error("PDF parsing error:", err);
    throw new Error("Failed to parse resume PDF");
  }
};

module.exports = { parseResume };