import ExcelJS from "exceljs";
import { StudyPlan } from "./index.js";

// Helper functions for clean formatting
function getStatusWithProgress(progressPercent: number): string {
    if (progressPercent <= 25) return `${progressPercent}% Complete (Early Stage)`;
    if (progressPercent <= 50) return `${progressPercent}% Complete (Quarter Done)`;
    if (progressPercent <= 75) return `${progressPercent}% Complete (Halfway)`;
    return `${progressPercent}% Complete (Final Stage)`;
}

export async function generateExcelSpreadsheet(studyPlan: StudyPlan, filename: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = "Calculus 2 Study Planner";
    workbook.lastModifiedBy = "Study Planner";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = "Advanced Study Planning System";
    workbook.manager = "AI Study Assistant";

    // Create the main worksheet with advanced settings
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
            printTitlesRow: "1:1", // Repeat header row on each page
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
        },
        headerFooter: {
            firstHeader: '&C&"Arial,Bold"Calculus 2 Study Plan - Daily Schedule',
            firstFooter: "&L&D &T&C&P&RGenerated by Advanced Study Planner",
        },
        views: [
            {
                state: "frozen",
                xSplit: 0,
                ySplit: 1, // Freeze header row
                topLeftCell: "A2",
                activeCell: "A2",
            },
        ],
    });

    // Define column widths and headers with clean formatting
    worksheet.columns = [
        { header: "Day", key: "day", width: 14 },
        { header: "Date", key: "date", width: 16 },
        { header: "Calculus 2 Topic", key: "topic", width: 32 },
        { header: "Daily Goal", key: "goal", width: 38 },
        { header: "Daily Schedule", key: "schedule", width: 65 },
        { header: "Unit", key: "unit", width: 28 },
        { header: "Week", key: "week", width: 12 },
        { header: "Study Hours", key: "hours", width: 14 },
        { header: "Status", key: "completed", width: 18 },
    ];

    // Style the header row with advanced formatting
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
        name: "Segoe UI",
        size: 13,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
    headerRow.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 90,
        stops: [
            { position: 0, color: { argb: "FF2E75B6" } },
            { position: 1, color: { argb: "FF1E40AF" } },
        ],
    };
    headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
    };
    headerRow.height = 35;

    // Add advanced header borders
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: "thick", color: { argb: "FF1E40AF" } },
            left: { style: "medium", color: { argb: "FF1E40AF" } },
            bottom: { style: "thick", color: { argb: "FF1E40AF" } },
            right: { style: "medium", color: { argb: "FF1E40AF" } },
        };
    });

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

        // Format the daily schedule with clean formatting
        const scheduleItems = day.dailySchedule.split(" | ");
        const formattedSchedule = scheduleItems
            .map((item) => {
                // Clean time formatting
                return item
                    .replace(/\((\d+\.?\d*h?)\)/g, "[$1]") // Format duration in brackets
                    .replace(/- /g, "- "); // Keep simple dash for descriptions
            })
            .join("\n");

        // Enhanced date formatting
        const dateObj = new Date(day.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        });

        const row = worksheet.addRow({
            day: day.day,
            date: formattedDate,
            topic: day.calc2Topic,
            goal: enhancedGoal,
            schedule: formattedSchedule,
            unit: formattedUnit,
            week: `Week ${day.weekNumber}`,
            hours: `${day.studyHours} hours`,
            completed: getStatusWithProgress(progressPercent),
        });

        // Advanced alternating row styling with subtle gradients
        if (index % 2 === 0) {
            row.fill = {
                type: "gradient",
                gradient: "angle",
                degree: 45,
                stops: [
                    { position: 0, color: { argb: "FFFBFCFD" } },
                    { position: 1, color: { argb: "FFF8F9FA" } },
                ],
            };
        } else {
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFFFF" },
            };
        }

        // Enhanced row styling
        row.font = {
            name: "Segoe UI",
            size: 10,
        };
        row.alignment = {
            vertical: "top",
            wrapText: true,
        };
        row.height = 60; // Increased for better schedule visibility

        // Advanced column-specific styling
        row.getCell("day").font = { name: "Segoe UI", size: 11, bold: true };
        row.getCell("day").alignment = { horizontal: "center", vertical: "middle" };

        row.getCell("date").font = { name: "Segoe UI", size: 10, bold: true };
        row.getCell("date").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("date").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F9FF" }, // Light blue background for dates
        };

        row.getCell("topic").font = { name: "Segoe UI", size: 10, bold: true };
        row.getCell("topic").alignment = { vertical: "middle", wrapText: true };

        row.getCell("goal").font = { name: "Segoe UI", size: 9 };
        row.getCell("goal").alignment = { vertical: "top", wrapText: true };

        row.getCell("schedule").alignment = { vertical: "top", wrapText: true };
        row.getCell("schedule").font = { name: "Consolas", size: 8 }; // Monospace for schedule
        row.getCell("schedule").fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF7FF" }, // Light purple background for schedule
        };

        row.getCell("week").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("week").font = { name: "Segoe UI", size: 9, bold: true };

        row.getCell("hours").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("hours").font = { name: "Segoe UI", size: 10, bold: true };

        row.getCell("completed").alignment = { horizontal: "center", vertical: "middle" };
        row.getCell("completed").font = { name: "Segoe UI", size: 9, bold: true };

        // Advanced unit color-coding with gradients and enhanced styling
        const unitStyles: { [key: string]: { colors: string[]; textColor: string } } = {
            "Integrals Review": { colors: ["FFE3F2FD", "FFBBDEFB"], textColor: "FF1565C0" },
            "Integration Techniques": { colors: ["FFE8F5E8", "FFC8E6C9"], textColor: "FF2E7D32" },
            "Differential Equations": { colors: ["FFFFF3E0", "FFFFE0B2"], textColor: "FFF57C00" },
            "Applications of Integrals": { colors: ["FFF3E5F5", "FFE1BEE7"], textColor: "FF7B1FA2" },
            "Parametric & Polar Functions": { colors: ["FFFFE0E0", "FFFFCDD2"], textColor: "FFD32F2F" },
            "Infinite Series": { colors: ["FFFCE4EC", "FFF8BBD9"], textColor: "FFC2185B" },
        };

        const unitStyle = unitStyles[formattedUnit];
        if (unitStyle) {
            row.getCell("unit").fill = {
                type: "gradient",
                gradient: "angle",
                degree: 45,
                stops: [
                    { position: 0, color: { argb: unitStyle.colors[0] } },
                    { position: 1, color: { argb: unitStyle.colors[1] } },
                ],
            };
            row.getCell("unit").font = {
                name: "Segoe UI",
                size: 10,
                bold: true,
                color: { argb: unitStyle.textColor },
            };
            row.getCell("unit").alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            row.getCell("unit").border = {
                top: { style: "thin", color: { argb: unitStyle.textColor } },
                left: { style: "thin", color: { argb: unitStyle.textColor } },
                bottom: { style: "thin", color: { argb: unitStyle.textColor } },
                right: { style: "thin", color: { argb: unitStyle.textColor } },
            };
        }
    });

    // Add enhanced borders
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row (already styled)

        row.eachCell((cell) => {
            // Enhanced borders with varying styles
            const borderStyle = rowNumber % 5 === 0 ? "medium" : "thin";
            const borderColor = rowNumber % 5 === 0 ? "FF9CA3AF" : "FFE5E7EB";

            cell.border = {
                top: { style: borderStyle, color: { argb: borderColor } },
                left: { style: "thin", color: { argb: "FFE5E7EB" } },
                bottom: { style: borderStyle, color: { argb: borderColor } },
                right: { style: "thin", color: { argb: "FFE5E7EB" } },
            };
        });
    });

    // Add an enhanced summary sheet
    const summarySheet = workbook.addWorksheet("Study Plan Summary", {
        pageSetup: {
            paperSize: 9,
            orientation: "portrait",
            margins: {
                left: 1.0,
                right: 1.0,
                top: 1.0,
                bottom: 1.0,
                header: 0.5,
                footer: 0.5,
            },
        },
        headerFooter: {
            firstHeader: '&C&"Arial,Bold"Calculus 2 Study Plan - Summary Overview',
            firstFooter: "&L&D &T&C&P&RAdvanced Study Planning System",
        },
    });

    // Enhanced summary sheet styling
    summarySheet.columns = [
        { header: "Study Metric", key: "metric", width: 35 },
        { header: "Value", key: "value", width: 25 },
        { header: "Progress", key: "progress", width: 20 },
    ];

    const summaryHeaderRow = summarySheet.getRow(1);
    summaryHeaderRow.font = {
        name: "Segoe UI",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
    summaryHeaderRow.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 90,
        stops: [
            { position: 0, color: { argb: "FF1E40AF" } },
            { position: 1, color: { argb: "FF2E75B6" } },
        ],
    };
    summaryHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
    };
    summaryHeaderRow.height = 40;

    // Add enhanced summary data with progress indicators
    const totalTopics = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topics.length, 0);
    const totalHours = studyPlan.dailyBreakdown.reduce((sum, day) => sum + day.studyHours, 0);

    const summaryData = [
        {
            metric: "Total Study Days",
            value: `${studyPlan.dailyBreakdown.length} days`,
            progress: "100% Planned",
        },
        {
            metric: "Total Study Hours",
            value: `${totalHours} hours`,
            progress: `${Math.round(totalHours / 10)}% Intensive`,
        },
        {
            metric: "Daily Calculus Study",
            value: `${studyPlan.calcStudyHoursPerDay} hours/day`,
            progress: "Optimal Load",
        },
        {
            metric: "Daily Video Editing",
            value: `${studyPlan.videoEditingHoursPerDay} hours/day`,
            progress: "Work Balance",
        },
        {
            metric: "Study Period",
            value: `${studyPlan.dailyBreakdown[0]?.date} to ${studyPlan.dailyBreakdown[studyPlan.dailyBreakdown.length - 1]?.date}`,
            progress: "3 Months",
        },
        {
            metric: "Calculus 2 Units",
            value: `${studyPlan.unitPlanning.length} units`,
            progress: "Complete Coverage",
        },
        {
            metric: "Total Topics",
            value: `${totalTopics} topics`,
            progress: "Comprehensive",
        },
        {
            metric: "Success Rate Target",
            value: "85%+ Mastery",
            progress: "High Achievement",
        },
    ];

    summaryData.forEach((item, index) => {
        const row = summarySheet.addRow(item);

        // Enhanced summary row styling
        row.font = { name: "Segoe UI", size: 11 };
        row.height = 35;

        // Metric column styling
        row.getCell("metric").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF1E293B" } };
        row.getCell("metric").alignment = { vertical: "middle", horizontal: "left" };

        // Value column styling
        row.getCell("value").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF059669" } };
        row.getCell("value").alignment = { vertical: "middle", horizontal: "center" };

        // Progress column styling
        row.getCell("progress").font = { name: "Segoe UI", size: 10, italic: true, color: { argb: "FF7C3AED" } };
        row.getCell("progress").alignment = { vertical: "middle", horizontal: "center" };

        // Alternating row colors with gradients
        if (index % 2 === 0) {
            row.fill = {
                type: "gradient",
                gradient: "angle",
                degree: 45,
                stops: [
                    { position: 0, color: { argb: "FFFBFCFD" } },
                    { position: 1, color: { argb: "FFF1F5F9" } },
                ],
            };
        } else {
            row.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFFFF" },
            };
        }

        // Enhanced borders
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin", color: { argb: "FFCBD5E1" } },
                left: { style: "thin", color: { argb: "FFCBD5E1" } },
                bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
                right: { style: "thin", color: { argb: "FFCBD5E1" } },
            };
        });

        // Special styling for important rows
        if (index === 0 || index === summaryData.length - 1) {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: "medium", color: { argb: "FF2563EB" } },
                    left: { style: "medium", color: { argb: "FF2563EB" } },
                    bottom: { style: "medium", color: { argb: "FF2563EB" } },
                    right: { style: "medium", color: { argb: "FF2563EB" } },
                };
            });
        }
    });

    // Add comprehensive content breakdown worksheet
    const contentSheet = workbook.addWorksheet("Detailed Content Breakdown", {
        pageSetup: {
            paperSize: 9,
            orientation: "landscape",
            margins: {
                left: 0.5,
                right: 0.5,
                top: 0.75,
                bottom: 0.75,
                header: 0.3,
                footer: 0.3,
            },
            printTitlesRow: "1:1",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
        },
        headerFooter: {
            firstHeader: '&C&"Arial,Bold"Calculus 2 - Detailed Content Breakdown',
            firstFooter: "&L&D &T&C&P&RAll Videos, Exercises, Quizzes, and Tests",
        },
        views: [
            {
                state: "frozen",
                xSplit: 0,
                ySplit: 1,
                topLeftCell: "A2",
                activeCell: "A2",
            },
        ],
    });

    // Define columns for detailed content
    contentSheet.columns = [
        { header: "Unit", key: "unit", width: 28 },
        { header: "Topic", key: "topic", width: 35 },
        { header: "Content Type", key: "type", width: 16 },
        { header: "Content Title", key: "title", width: 45 },
        { header: "Time (min)", key: "minutes", width: 12 },
        { header: "Description", key: "description", width: 50 },
        { header: "Khan Academy URL", key: "url", width: 35 },
        { header: "Status", key: "status", width: 15 },
    ];

    // Style the content header row
    const contentHeaderRow = contentSheet.getRow(1);
    contentHeaderRow.font = {
        name: "Segoe UI",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
    contentHeaderRow.fill = {
        type: "gradient",
        gradient: "angle",
        degree: 90,
        stops: [
            { position: 0, color: { argb: "FF059669" } },
            { position: 1, color: { argb: "FF047857" } },
        ],
    };
    contentHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
    };
    contentHeaderRow.height = 35;

    contentHeaderRow.eachCell((cell) => {
        cell.border = {
            top: { style: "thick", color: { argb: "FF047857" } },
            left: { style: "medium", color: { argb: "FF047857" } },
            bottom: { style: "thick", color: { argb: "FF047857" } },
            right: { style: "medium", color: { argb: "FF047857" } },
        };
    });

    // Add all content items from the study plan
    let contentRowIndex = 0;
    studyPlan.unitPlanning.forEach((unit) => {
        unit.topicDetails.forEach((topic) => {
            topic.contents.forEach((content) => {
                contentRowIndex++;

                // Determine content type styling and emojis
                let typeDisplay = content.contentKind;
                let typeEmoji = "📄";
                let typeColor = "FF6B7280";

                switch (content.contentKind) {
                    case "Video":
                        typeEmoji = "🎥";
                        typeColor = "FFE53E3E";
                        typeDisplay = "Video";
                        break;
                    case "Exercise":
                        typeEmoji = "📝";
                        typeColor = "FF3B82F6";
                        typeDisplay = "Exercise";
                        break;
                    case "Article":
                        typeEmoji = "📖";
                        typeColor = "FF8B5CF6";
                        typeDisplay = "Article";
                        break;
                    case "Topic quiz":
                        typeEmoji = "📋";
                        typeColor = "FFF59E0B";
                        typeDisplay = "Quiz";
                        break;
                    case "Topic unit test":
                        typeEmoji = "🎯";
                        typeColor = "FFEF4444";
                        typeDisplay = "Unit Test";
                        break;
                    case "Quiz":
                        typeEmoji = "📊";
                        typeColor = "FFF59E0B";
                        typeDisplay = "Quiz";
                        break;
                    case "Test":
                        typeEmoji = "🎯";
                        typeColor = "FFEF4444";
                        typeDisplay = "Test";
                        break;
                    case "Assessment":
                        typeEmoji = "✅";
                        typeColor = "FF10B981";
                        typeDisplay = "Assessment";
                        break;
                    case "Practice":
                        typeEmoji = "🔄";
                        typeColor = "FF06B6D4";
                        typeDisplay = "Practice";
                        break;
                }

                const row = contentSheet.addRow({
                    unit: unit.unitTitle,
                    topic: topic.title,
                    type: `${typeEmoji} ${typeDisplay}`,
                    title: content.title,
                    minutes: Math.round(content.estimatedMinutes),
                    description: content.title, // Using title as description for now
                    url: content.url ? `https://khanacademy.org${content.url}` : "N/A",
                    status: "Not Started",
                });

                // Row styling
                row.font = { name: "Segoe UI", size: 10 };
                row.height = 25;
                row.alignment = { vertical: "middle", wrapText: true };

                // Alternating row colors
                if (contentRowIndex % 2 === 0) {
                    row.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF9FAFB" },
                    };
                }

                // Unit column styling
                row.getCell("unit").font = { name: "Segoe UI", size: 9, bold: true };
                row.getCell("unit").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

                // Topic column styling
                row.getCell("topic").font = { name: "Segoe UI", size: 9, bold: true };
                row.getCell("topic").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

                // Content type styling with colors
                row.getCell("type").font = {
                    name: "Segoe UI",
                    size: 10,
                    bold: true,
                    color: { argb: typeColor },
                };
                row.getCell("type").alignment = { vertical: "middle", horizontal: "center" };

                // Title styling
                row.getCell("title").font = { name: "Segoe UI", size: 10 };
                row.getCell("title").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

                // Time styling
                row.getCell("minutes").font = { name: "Segoe UI", size: 10, bold: true };
                row.getCell("minutes").alignment = { vertical: "middle", horizontal: "center" };
                row.getCell("minutes").fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF0F9FF" },
                };

                // Description styling
                row.getCell("description").font = { name: "Segoe UI", size: 9 };
                row.getCell("description").alignment = { vertical: "middle", horizontal: "left", wrapText: true };

                // URL styling
                if (content.url) {
                    row.getCell("url").font = {
                        name: "Segoe UI",
                        size: 8,
                        underline: true,
                        color: { argb: "FF2563EB" },
                    };
                    row.getCell("url").alignment = { vertical: "middle", horizontal: "left", wrapText: true };
                }

                // Status styling
                row.getCell("status").font = { name: "Segoe UI", size: 9, italic: true };
                row.getCell("status").alignment = { vertical: "middle", horizontal: "center" };
                row.getCell("status").fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFFEF2F2" },
                };

                // Add borders
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFE5E7EB" } },
                        left: { style: "thin", color: { argb: "FFE5E7EB" } },
                        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
                        right: { style: "thin", color: { argb: "FFE5E7EB" } },
                    };
                });
            });
        });
    });

    // Add summary statistics at the bottom of content sheet
    const totalVideos = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Video").length, 0), 0);

    const totalExercises = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Exercise").length, 0), 0);

    const totalQuizzes = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length, 0), 0);

    const totalTests = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length, 0), 0);

    const totalArticles = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Article").length, 0), 0);

    const totalContent = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.length, 0), 0);

    // Add summary rows
    contentSheet.addRow([]);
    const summaryStartRow = contentSheet.addRow({
        unit: "CONTENT SUMMARY",
        topic: "",
        type: "",
        title: "",
        minutes: "",
        description: "",
        url: "",
        status: "",
    });

    summaryStartRow.font = { name: "Segoe UI", size: 12, bold: true };
    summaryStartRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2937" },
    };
    summaryStartRow.getCell("unit").font = {
        name: "Segoe UI",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
    };

    const summaryRows = [
        { label: "🎥 Total Videos", count: totalVideos },
        { label: "📝 Total Exercises", count: totalExercises },
        { label: "📖 Total Articles", count: totalArticles },
        { label: "📋 Total Quizzes", count: totalQuizzes },
        { label: "🎯 Total Tests", count: totalTests },
        { label: "📚 Total Content Items", count: totalContent },
    ];

    summaryRows.forEach((item) => {
        const row = contentSheet.addRow({
            unit: item.label,
            topic: item.count.toString(),
            type: "",
            title: "",
            minutes: "",
            description: "",
            url: "",
            status: "",
        });

        row.font = { name: "Segoe UI", size: 11, bold: true };
        row.getCell("unit").font = { name: "Segoe UI", size: 11, bold: true };
        row.getCell("topic").font = { name: "Segoe UI", size: 11, bold: true, color: { argb: "FF059669" } };
        row.getCell("topic").alignment = { vertical: "middle", horizontal: "center" };
    });

    // Save the file
    await workbook.xlsx.writeFile(filename);
    return filename;
}
