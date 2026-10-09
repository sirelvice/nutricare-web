import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { Report } from "./service";
import { reportLogoPNG } from "./pdf-logo";

const goals = { lose: "Lose weight", maintain: "Maintain weight", gain: "Gain weight" };
const activities = { sedentary: "Sedentary", light: "Light", moderate: "Moderate", active: "Active", very_active: "Very active" };
export async function renderReportPDF(report: Report): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle("NutriCare Personal Report");
  document.setCreator("NutriCare");
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const logo = await document.embedPng(reportLogoPNG);
  const green = rgb(0.055, 0.25, 0.14);
  const gold = rgb(0.91, 0.65, 0.24);
  const ink = rgb(0.12, 0.18, 0.15);
  const muted = rgb(0.4, 0.46, 0.42);
  const paper = rgb(0.96, 0.98, 0.96);
  const margin = 48;
  const width = 595.28;
  const height = 841.89;
  const contentWidth = width - margin * 2;
  let page = document.addPage([width, height]);
  const header = (first: boolean) => {
    const top = height - 38;
    const bandHeight = first ? 95 : 66;
    page.drawRectangle({ x: 38, y: top - bandHeight, width: width - 76, height: bandHeight, color: green });
    page.drawRectangle({ x: 38, y: top - bandHeight, width: width - 76, height: 3, color: gold });
    const logoWidth = first ? 156 : 110;
    const logoHeight = logoWidth * logo.height / logo.width;
    const panelWidth = logoWidth + 16;
    const panelHeight = logoHeight + 14;
    const panelX = width - 50 - panelWidth;
    const panelY = top - 14 - panelHeight;
    page.drawRectangle({ x: panelX, y: panelY, width: panelWidth, height: panelHeight, color: rgb(1, 1, 1) });
    page.drawImage(logo, { x: panelX + 8, y: panelY + 7, width: logoWidth, height: logoHeight });
    page.drawText("PERSONAL REPORT", { x: 54, y: top - 24, size: 8, font: bold, color: gold });
    page.drawText(first ? "Your health overview" : "Report continued", { x: 54, y: top - (first ? 52 : 43), size: first ? 21 : 14, font: bold, color: rgb(1, 1, 1) });
    if (first) page.drawText("Measurements, saved targets and progress", { x: 54, y: top - 75, size: 8, font: regular, color: rgb(0.84, 0.91, 0.86) });
    return top - bandHeight - 22;
  };
  let y = header(true);
  const ensureRoom = (amount: number) => {
    if (y - amount < 72) { page = document.addPage([width, height]); y = header(false); }
  };
  const line = (text: string, size: number, font: PDFFont) => {
    ensureRoom(size + 4);
    page.drawText(text, { x: margin, y, size, font, color: rgb(0.12, 0.18, 0.15) });
    y -= size + 4;
  };
  const paragraph = (value: string, size = 10, font = regular) => {
    // Report copy is supplied by the application, not user-entered notes or names.
    const text = value.replace(/[\r\n\t]+/g, " ").replace(/[\u2013\u2014]/g, "-");
    let current = "";
    for (const word of text.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= contentWidth) { current = candidate; continue; }
      if (current) { line(current, size, font); current = ""; }
      // Split a single long token instead of letting it run beyond the margin.
      for (const character of word) {
        if (current && font.widthOfTextAtSize(current + character, size) > contentWidth) {
          line(current, size, font); current = "";
        }
        current += character;
      }
    }
    if (current) line(current, size, font);
  };
  const section = (title: string) => {
    ensureRoom(60); y -= 10;
    page.drawRectangle({ x: margin, y: y - 5, width: 3, height: 16, color: gold });
    page.drawText(title, { x: margin + 11, y, size: 12, font: bold, color: green });
    y -= 24;
  };
  const timestamp = (value: string) => new Date(value).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");

  paragraph(`Generated ${timestamp(report.generatedAt)}`, 9);
  y -= 8;
  const metrics = [
    ["LATEST WEIGHT", report.weight.entries[0] ? `${report.weight.entries[0].weightKg} kg` : "Not recorded"],
    ["BODY MASS INDEX", report.bmi.latest ? report.bmi.latest.value.toFixed(1) : "Not available"],
    ["SAVED CALORIE TARGET", report.nutritionPlan ? `${report.nutritionPlan.targetCalories} kcal/day` : "Not available"],
  ];
  const metricWidth = (contentWidth - 20) / 3;
  metrics.forEach(([label, value], index) => {
    const x = margin + index * (metricWidth + 10);
    page.drawRectangle({ x, y: y - 62, width: metricWidth, height: 62, color: paper });
    page.drawText(label, { x: x + 12, y: y - 17, size: 7, font: bold, color: muted });
    page.drawText(value, { x: x + 12, y: y - 42, size: 15, font: bold, color: green });
  });
  y -= 78;
  const rows = (values: [string, string][]) => {
    y -= 8;
    for (let index = 0; index < values.length; index += 2) {
      ensureRoom(30);
      page.drawRectangle({ x: margin, y: y - 10, width: contentWidth, height: 30, color: paper });
      values.slice(index, index + 2).forEach(([label, value], column) => {
        const x = margin + column * contentWidth / 2;
        page.drawText(label, { x: x + 12, y, size: 8, font: regular, color: muted });
        page.drawText(value, { x: x + 105, y, size: 9, font: bold, color: ink });
      });
      y -= 34;
    }
  };
  section("Profile");
  rows([
    ["Goal", goals[report.profile.goal]], ["Activity", activities[report.profile.activity]],
    ["Height", report.profile.heightCm === null ? "Not provided" : `${report.profile.heightCm} cm`],
    ["Age", report.profile.age === null ? "Not provided" : `${report.profile.age} years`],
  ]);

  section("Measurements");
  const latest = report.weight.entries[0];
  paragraph(latest ? `Latest weight: ${latest.weightKg} kg on ${latest.date}` : "Latest weight: Not recorded");
  paragraph(report.bmi.latest ? `BMI: ${report.bmi.latest.value.toFixed(1)} (${report.bmi.latest.category.label})` : "BMI: Not available");
  paragraph("BMI is calculated from the latest weight and current profile height. It is an adult screening measure, not a diagnosis.", 9);
  paragraph(`Weight entries: ${report.weight.entriesCount}`);
  if (report.weight.stats) {
    const { first, last, change } = report.weight.stats;
    paragraph(`Recorded change: ${change > 0 ? "+" : ""}${change} kg from ${first.date} to ${last.date}`);
    paragraph(`First: ${first.weightKg} kg | Last: ${last.weightKg} kg`);
  }

  section("Saved nutrition targets");
  const plan = report.nutritionPlan;
  if (plan) {
    paragraph(`Plan version: ${plan.version} | Goal: ${goals[plan.goal]}`);
    paragraph(`Saved ${timestamp(plan.createdAt)}`, 9);
    rows([
      ["Daily calorie target", `${plan.targetCalories} kcal/day`],
      ["Protein", `${plan.proteinG} g/day`], ["Carbohydrates", `${plan.carbsG} g/day`], ["Fat", `${plan.fatG} g/day`],
    ]);
    paragraph("These are saved targets, not food consumed or confirmation that an old target remains suitable.", 9);
  } else { paragraph("No nutrition plan has been generated yet."); }

  section("Progress insight");
  const progress = report.progress;
  if (progress && progress.planVersionId === plan?.id) {
    paragraph(progress.evaluation.headline, 11, bold);
    paragraph(progress.evaluation.summary);
    paragraph(progress.recommendation.message);
    paragraph(`Evaluated ${timestamp(progress.evaluation.evaluatedAt)}`, 9);
  } else { paragraph("No progress evaluation available"); }
  y -= 8;
  paragraph("This export uses saved account data at download time and may differ from a report opened earlier. Measurements and saved targets are provided for personal reference.", 9);
  paragraph("This report is not a diagnosis or a substitute for individual advice from a qualified health professional.", 9);

  const pages = document.getPages();
  pages.forEach((item, index) => {
    item.drawLine({ start: { x: margin, y: 48 }, end: { x: width - margin, y: 48 }, thickness: 0.5, color: rgb(0.8, 0.86, 0.81) });
    item.drawText("Personal report - keep this document private.", { x: margin, y: 32, size: 8, font: regular, color: rgb(0.4, 0.45, 0.42) });
    item.drawText(`${index + 1} / ${pages.length}`, { x: width - margin - 35, y: 32, size: 8, font: regular });
  });
  return document.save();
}
