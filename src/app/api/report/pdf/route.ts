// src/app/api/report/pdf/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs"; // safe — pdf-lib works fine here

export async function GET() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 (595 × 842 pt)
  const width = page.getWidth();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = page.getHeight() - margin; // start from top

  // ── Logo ────────────────────────────────────────────────────────────────
  try {
    const logoBytes = await fetch("http://localhost:3000/brand/nutricare-design-no-bg-low.png")
      .then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoBytes);

    const logoScale = 0.15; // adjust this to fit nicely
    const logoWidth = logoImage.width * logoScale;
    const logoHeight = logoImage.height * logoScale;

    // Center horizontally
    const logoX = (width - logoWidth) / 2;

    page.drawImage(logoImage, {
      x: logoX,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });

    y -= logoHeight + 20; // space below logo
  } catch (e) {
    console.error("Failed to load logo:", e);
    // Continue without logo if it fails (fallback)
  }

  // ── Main Title (centered below logo) ───────────────────────────────────
  const title = "NutriCare Impact Snapshot";
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 20);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 24,
    font: helveticaBold,
    color: rgb(0.1, 0.12, 0.16),
  });

  y -= 40; // space after title

  // ── Subtitle ────────────────────────────────────────────────────────────
  const sub = "Generated for program reporting and donor/partner review";
  const subWidth = helvetica.widthOfTextAtSize(sub, 12);
  page.drawText(sub, {
    x: (width - subWidth) / 2,
    y,
    size: 12,
    font: helvetica,
    color: rgb(0.35, 0.4, 0.5),
  });

  y -= 50;

  // ── Content Helpers ─────────────────────────────────────────────────────
  const drawSectionTitle = (text: string) => {
    page.drawText(text, {
      x: margin,
      y,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.12, 0.16),
    });
    y -= 24;
  };

  const drawBullet = (text: string) => {
    page.drawText(`• ${text}`, {
      x: margin + 10,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0.12, 0.14, 0.18),
    });
    y -= 18;
  };

  // ── Summary Section ─────────────────────────────────────────────────────
  drawSectionTitle("Summary");
  drawBullet("People reached: 1,245");
  drawBullet("Facilities: 18");
  drawBullet("Screenings completed: 3,420");
  drawBullet("Reports exported: 62");

  y -= 20;

  // ── Safeguards Section ──────────────────────────────────────────────────
  drawSectionTitle("Safeguards");
  drawBullet("Privacy-first data handling");
  drawBullet("No individual health data shared");
  drawBullet("Aggregated metrics only");

  y -= 40;

  // ── Footer Note ─────────────────────────────────────────────────────────
  const note = "Note: This is a demo snapshot. Future versions will pull real data from profile and tracking history.";
  const noteLines = note.split('\n');
  noteLines.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.55),
    });
    y -= 14;
  });

  // ── Footer (date/time + page number) ────────────────────────────────────
  const now = new Date();
  const footerText = `Generated on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
  const pageNum = "Page 1 of 1";

  page.drawText(footerText, {
    x: margin,
    y: margin - 10,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pageNumWidth = helvetica.widthOfTextAtSize(pageNum, 9);
  page.drawText(pageNum, {
    x: width - margin - pageNumWidth,
    y: margin - 10,
    size: 9,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Thin line separator above footer
  page.drawLine({
    start: { x: margin, y: margin + 10 },
    end: { x: width - margin, y: margin + 10 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Save & serve
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="nutricare-impact-report.pdf"',
      "Cache-Control": "no-store",
    },
  });
}