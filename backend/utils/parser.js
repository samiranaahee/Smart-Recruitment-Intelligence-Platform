const pdfParse = require("pdf-parse");

const parseResume = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer, {
      max: 0,
    });
    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF appears to be empty or scanned — no text could be extracted");
    }
    return data.text.trim();
  } catch (err) {
    if (err.message.includes("XRef")) {
      throw new Error("PDF file is corrupted or in an unsupported format. Please export a fresh PDF from Word or Google Docs.");
    }
    throw new Error("Failed to parse PDF: " + err.message);
  }
};

module.exports = { parseResume };