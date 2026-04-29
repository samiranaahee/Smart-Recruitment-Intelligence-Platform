const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"AI Recruiter" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const sendInterviewInvite = async (candidate, interview, job) => {
  await sendEmail({
    to: candidate.email,
    subject: `Interview Scheduled — ${job.title}`,
    html: `
      <h2>Hello ${candidate.name},</h2>
      <p>You have been shortlisted for an interview for the position of <strong>${job.title}</strong>.</p>
      <p><strong>Date & Time:</strong> ${new Date(interview.scheduledAt).toLocaleString()}</p>
      <p><strong>Type:</strong> ${interview.type}</p>
      ${interview.meetLink ? `<p><strong>Meet Link:</strong> <a href="${interview.meetLink}">${interview.meetLink}</a></p>` : ""}
      <p>Good luck!</p>
    `,
  });
};

const sendOfferEmail = async (candidate, job) => {
  await sendEmail({
    to: candidate.email,
    subject: `Job Offer — ${job.title}`,
    html: `
      <h2>Congratulations ${candidate.name}!</h2>
      <p>We are pleased to offer you the position of <strong>${job.title}</strong>.</p>
      <p>Our HR team will be in touch with further details.</p>
    `,
  });
};

const sendRejectionEmail = async (candidate, job) => {
  await sendEmail({
    to: candidate.email,
    subject: `Application Update — ${job.title}`,
    html: `
      <h2>Hello ${candidate.name},</h2>
      <p>Thank you for applying for <strong>${job.title}</strong>.</p>
      <p>After careful consideration, we have decided to move forward with other candidates.</p>
      <p>We wish you the best in your job search.</p>
    `,
  });
};

const sendWeeklyReport = async (company, stats) => {
  await sendEmail({
    to: company.email,
    subject: `Weekly Hiring Report — ${company.companyName}`,
    html: `
      <h2>Weekly Hiring Report</h2>
      <p>Here is your hiring summary for this week:</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><td>Total Applicants</td><td>${stats.totalApplicants}</td></tr>
        <tr><td>Shortlisted</td><td>${stats.shortlisted}</td></tr>
        <tr><td>Interviews Scheduled</td><td>${stats.interviews}</td></tr>
        <tr><td>Offers Made</td><td>${stats.offers}</td></tr>
        <tr><td>Hired</td><td>${stats.hired}</td></tr>
      </table>
    `,
  });
};

module.exports = {
  sendEmail,
  sendInterviewInvite,
  sendOfferEmail,
  sendRejectionEmail,
  sendWeeklyReport,
};