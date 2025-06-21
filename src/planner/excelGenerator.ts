import ExcelJS from "exceljs";
import { StudyPlan } from "./index.js";

export async function generateExcelSpreadsheet(studyPlan: StudyPlan, filename: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = "Calculus 2 Study Planner";
    workbook.lastModifiedBy = "Study Planner";
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create the main worksheet
    const worksheet = workbook.addWorksheet("Daily Study Schedule", {
        pageSetup: {
            paperSize: 9, // A4
            orientation: "landscape",
            margins: {
                left: 0.7,
                right: 0.7,
                top: 0.75,
                bottom: 0.75,
                header: 0.3,
                footer: 0.3,
            },
        },
    });

    // Define column widths and headers
    worksheet.columns = [
        { header: "Day", key: "day", width: 12 },
        { header: "Date", key: "date", width: 15 },
        { header: "Calculus 2 Topic", key: "topic", width: 35 },
        { header: "Daily Goal", key: "goal", width: 45 },
        { header: "Unit", key: "unit", width: 25 },
        { header: "Week", key: "week", width: 10 },
        { header: "Study Hours", key: "hours", width: 12 },
        { header: "Completed", key: "completed", width: 15 },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
        name: "Segoe UI",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E75B6" }, // Professional blue
    };
    headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
    headerRow.height = 25;

    // Add data rows with formatting
    studyPlan.dailyBreakdown.forEach((day, index) => {
        const enhancedGoal = day.topicBreakdown.replace("Complete: ", "Master: ").replace("Continue: ", "Continue: ").replace("Work on: ", "Work on: ").replace(" + Start next topic", " → Begin next topic");

        const formattedUnit = day.unitTitle
            .replace("Integrals review", "Integrals Review")
            .replace("Integration techniques", "Integration Techniques")
            .replace("Differential equations", "Differential Equations")
            .replace("Applications of integrals", "Applications of Integrals")
            .replace("Parametric equations, polar coordinates, and vector-valued functions", "Parametric & Polar Functions")
            .replace("Series", "Infinite Series");

        const totalDays = studyPlan.dailyBreakdown.length;
        const progressPercent = Math.round(((index + 1) / totalDays) * 100);

        const row = worksheet.addRow({
            day: day.day,
            date: day.date,
            topic: day.calc2Topic,
            goal: enhancedGoal,
            unit: formattedUnit,
            week: `Week ${day.weekNumber}`,
            hours: `${day.studyHours} hours`,
            completed: `☐ (${progressPercent}% complete)`,
        });

        // Alternate row colors for better readability
        if (index % 2 === 0) {
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8F9FA" }, // Light gray
            };
        }

        // Style the row
        row.font = {
            name: "Segoe UI",
            size: 10,
        };
        row.alignment = {
            vertical: "middle",
            wrapText: true,
        };
        row.height = 30;

        // Style specific columns
        row.getCell("day").font = { name: "Segoe UI", size: 10, bold: true };
        row.getCell("date").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("week").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("hours").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("completed").alignment = { horizontal: "center", vertical: "middle" };

        // Color-code units
        const unitColors: { [key: string]: string } = {
            "Integrals Review": "FFE3F2FD", // Light blue
            "Integration Techniques": "FFE8F5E8", // Light green
            "Differential Equations": "FFFFF3E0", // Light orange
            "Applications of Integrals": "FFF3E5F5", // Light purple
            "Parametric & Polar Functions": "FFFFE0E0", // Light red
            "Infinite Series": "FFFCE4EC", // Light pink
        };

        const unitColor = unitColors[formattedUnit];
        if (unitColor) {
            row.getCell("unit").fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: unitColor },
            };
            row.getCell("unit").font = { name: "Segoe UI", size: 10, bold: true };
        }
    });

    // Add borders to all cells
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin", color: { argb: "FFD0D0D0" } },
                left: { style: "thin", color: { argb: "FFD0D0D0" } },
                bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
                right: { style: "thin", color: { argb: "FFD0D0D0" } },
            };
        });
    });

    // Add a summary sheet
    const summarySheet = workbook.addWorksheet("Study Plan Summary");

    // Summary sheet styling
    summarySheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 20 },
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = {
        name: "Segoe UI",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
    summaryHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2E75B6" },
    };
    summaryHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
    };
    summaryHeaderRow.height = 30;

    // Add summary data
    const summaryData = [
        { metric: "Total Study Days", value: studyPlan.dailyBreakdown.length },
        { metric: "Total Study Hours", value: `${studyPlan.dailyBreakdown.reduce((sum, day) => sum + day.studyHours, 0)} hours` },
        { metric: "Daily Study Hours", value: `${studyPlan.calcStudyHoursPerDay} hours` },
        { metric: "Daily Video Editing", value: `${studyPlan.videoEditingHoursPerDay} hours` },
        { metric: "Study Period", value: `${studyPlan.dailyBreakdown[0]?.date} to ${studyPlan.dailyBreakdown[studyPlan.dailyBreakdown.length - 1]?.date}` },
        { metric: "Total Units", value: studyPlan.unitPlanning.length },
        { metric: "Total Topics", value: studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topics.length, 0) },
    ];

    summaryData.forEach((item, index) => {
        const row = summarySheet.addRow(item);
        row.font = { name: "Segoe UI", size: 11 };
        row.getCell("metric").font = { name: "Segoe UI", size: 11, bold: true };

        if (index % 2 === 0) {
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8F9FA" },
            };
        }

        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin", color: { argb: "FFD0D0D0" } },
                left: { style: "thin", color: { argb: "FFD0D0D0" } },
                bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
                right: { style: "thin", color: { argb: "FFD0D0D0" } },
            };
        });
    });

    // Save the file
    await workbook.xlsx.writeFile(filename);
    return filename;
}
