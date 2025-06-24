import PDFDocument from "pdfkit";
import * as fs from "fs";
import { StudyPlan, WeeklySchedule, Milestone, DailyTimeBlock, DailyBreakdown, UnitPlan } from "./index.js";

export class StudyPlanPDFGenerator {
    private doc: PDFKit.PDFDocument;
    private pageWidth: number;
    private pageHeight: number;
    private margin: number;
    private currentY: number;

    constructor() {
        this.doc = new PDFDocument({
            size: "A4",
            margin: 50,
            info: {
                Title: "Detailed Calculus 2 Daily Study Plan",
                Author: "Calculus 2 Planner",
                Subject: "Daily Study Schedule with Content Breakdown",
                Keywords: "calculus, study plan, daily schedule, content breakdown",
            },
        });

        this.pageWidth = this.doc.page.width;
        this.pageHeight = this.doc.page.height;
        this.margin = 50;
        this.currentY = this.margin;
    }

    async generatePDF(studyPlan: StudyPlan, filename: string = "calculus-2-study-plan.pdf"): Promise<string> {
        console.log("📄 Generating detailed daily PDF study plan...");

        // Create write stream
        const stream = fs.createWriteStream(filename);
        this.doc.pipe(stream);

        // Generate PDF content
        this.addHeader();
        this.addOverview(studyPlan);
        this.addContentSummary(studyPlan);
        this.addDailyScheduleTemplate(studyPlan.dailySchedule);
        this.addDetailedTopicBreakdown(studyPlan.unitPlanning);
        this.addWeeklySummary(studyPlan.weeklySchedule);
        this.addDetailedDailyPlanning(studyPlan.dailyBreakdown);
        this.addMilestones(studyPlan.milestones);
        this.addSuccessStrategies();
        this.addFooter();

        // Finalize the PDF
        this.doc.end();

        // Wait for the stream to finish
        await new Promise<void>((resolve, reject) => {
            stream.on("finish", () => resolve());
            stream.on("error", reject);
        });

        console.log(`✅ Detailed PDF generated successfully: ${filename}`);
        return filename;
    }

    private addHeader(): void {
        // Title
        this.doc
            .fontSize(22)
            .fillColor("#2563eb")
            .font("Helvetica-Bold")
            .text("Detailed Calculus 2 Daily Study Plan", this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: "center",
            });

        this.currentY += 35;

        // Subtitle
        this.doc
            .fontSize(14)
            .fillColor("#64748b")
            .font("Helvetica")
            .text("Complete Daily Breakdown with Content, Quizzes, and Tests", this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: "center",
            });

        this.currentY += 25;

        // Date
        const today = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        this.doc
            .fontSize(12)
            .fillColor("#6b7280")
            .text(`Generated on ${today}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: "center",
            });

        this.currentY += 35;
        this.addHorizontalLine();
    }

    private addOverview(studyPlan: StudyPlan): void {
        this.addSectionTitle("Study Plan Overview");

        const totalHours = studyPlan.totalCalcHoursNeeded;
        const dailyHours = studyPlan.calcStudyHoursPerDay;
        const videoEditingHours = studyPlan.videoEditingHoursPerDay;

        // Calculate content statistics
        const totalVideos = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Video").length, 0), 0);
        const totalExercises = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Exercise").length, 0), 0);
        const totalQuizzes = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length, 0), 0);
        const totalTests = studyPlan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length, 0), 0);

        this.doc.fontSize(12).fillColor("#374151").font("Helvetica");

        const overviewData = [
            `• Total Calculus 2 Study Time: ${totalHours} hours`,
            `• Daily Calculus Study: ${dailyHours} hours/day (1h morning + 2h afternoon)`,
            `• Daily Video Editing: ${videoEditingHours} hours/day`,
            `• Available Study Days: ${studyPlan.totalStudyDays} days`,
            `• Study Period: ${studyPlan.dailyBreakdown[0]?.date} to ${studyPlan.dailyBreakdown[studyPlan.dailyBreakdown.length - 1]?.date}`,
            `• Total Content: ${totalVideos} videos, ${totalExercises} exercises, ${totalQuizzes} quizzes, ${totalTests} tests`,
        ];

        overviewData.forEach((item) => {
            this.doc.text(item, this.margin, this.currentY);
            this.currentY += 18;
        });

        this.currentY += 15;
    }

    private addContentSummary(studyPlan: StudyPlan): void {
        this.addSectionTitle("Content Breakdown by Unit");

        this.doc.fontSize(11).fillColor("#374151").font("Helvetica");

        studyPlan.unitPlanning.forEach((unit) => {
            this.checkPageBreak(60);

            // Calculate content breakdown for this unit
            const unitVideos = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Video").length, 0);
            const unitExercises = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Exercise").length, 0);
            const unitQuizzes = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length, 0);
            const unitTests = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length, 0);

            // Unit title
            this.doc.fillColor("#2563eb").font("Helvetica-Bold").text(`${unit.unitNumber}. ${unit.unitTitle}`, this.margin, this.currentY);

            this.currentY += 16;

            // Unit details
            this.doc.fillColor("#6b7280").font("Helvetica");
            this.doc.text(`   • Time: ${unit.estimatedHours}h | Topics: ${unit.topics.length} | Videos: ${unitVideos} | Exercises: ${unitExercises}`, this.margin, this.currentY);
            this.currentY += 14;

            if (unitQuizzes > 0 || unitTests > 0) {
                this.doc.text(`   • Assessments: ${unitQuizzes} quizzes, ${unitTests} tests`, this.margin, this.currentY);
                this.currentY += 14;
            }

            this.currentY += 8;
        });

        this.currentY += 10;
    }

    private addDailyScheduleTemplate(schedule: DailyTimeBlock[]): void {
        this.checkPageBreak(200);
        this.addSectionTitle("Daily Schedule Template");

        this.doc.fontSize(11).fillColor("#374151").font("Helvetica");

        // Create a more compact table
        schedule.forEach((block) => {
            this.checkPageBreak(20);

            this.doc
                .fillColor("#2563eb")
                .font("Helvetica-Bold")
                .text(`${block.timeSlot}: `, this.margin, this.currentY, { continued: true })
                .fillColor("#374151")
                .font("Helvetica")
                .text(`${block.activity} - ${block.description}`, { width: this.pageWidth - 2 * this.margin - 120 });

            this.currentY += 16;
        });

        this.currentY += 15;
    }

    private addDetailedTopicBreakdown(unitPlanning: UnitPlan[]): void {
        this.checkPageBreak(100);
        this.addSectionTitle("Comprehensive Topic Breakdown");

        this.doc.fontSize(10).fillColor("#6b7280").font("Helvetica").text("Complete listing of all topics and content items with time estimates.", this.margin, this.currentY);
        this.currentY += 25;

        unitPlanning.forEach((unit) => {
            this.checkPageBreak(80);

            // Unit title
            this.doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(12).text(`Unit ${unit.unitNumber}: ${unit.unitTitle}`, this.margin, this.currentY);

            this.currentY += 18;

            // Unit summary
            this.doc
                .fillColor("#6b7280")
                .font("Helvetica")
                .fontSize(10)
                .text(`${unit.estimatedHours} hours | ${unit.topics.length} topics | ${unit.topicDetails.reduce((sum, topic) => sum + topic.contents.length, 0)} content items`, this.margin + 10, this.currentY);
            this.currentY += 16;

            // Topics
            unit.topicDetails.forEach((topic, topicIndex) => {
                this.checkPageBreak(50);

                // Topic title
                this.doc
                    .fillColor("#059669")
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text(`${topicIndex + 1}. ${topic.title}`, this.margin + 20, this.currentY);

                this.currentY += 14;

                // Topic summary
                this.doc
                    .fillColor("#6b7280")
                    .font("Helvetica")
                    .fontSize(9)
                    .text(`${topic.estimatedHours}h | ${topic.contents.length} items | ${topic.videoCount} videos`, this.margin + 30, this.currentY);
                this.currentY += 12;

                // Content items (show first few to avoid overwhelming the PDF)
                const contentToShow = topic.contents.slice(0, 3);
                contentToShow.forEach((content) => {
                    this.checkPageBreak(15);

                    const timeInMinutes = content.estimatedMinutes;
                    const timeDisplay = timeInMinutes >= 60 ? `${(timeInMinutes / 60).toFixed(1)}h` : `${Math.round(timeInMinutes)}min`;

                    this.doc
                        .fillColor("#374151")
                        .font("Helvetica")
                        .fontSize(8)
                        .text(`• ${content.contentKind}: ${content.title} (${timeDisplay})`, this.margin + 40, this.currentY, {
                            width: this.pageWidth - 2 * this.margin - 50,
                        });
                    this.currentY += 12;
                });

                // Show remaining count if there are more items
                if (topic.contents.length > 3) {
                    this.doc
                        .fillColor("#6b7280")
                        .font("Helvetica")
                        .fontSize(8)
                        .text(`... and ${topic.contents.length - 3} more content items`, this.margin + 40, this.currentY);
                    this.currentY += 12;
                }

                this.currentY += 6;
            });

            this.currentY += 10;
        });

        this.currentY += 15;
    }

    private addWeeklySummary(weeks: WeeklySchedule[]): void {
        this.checkPageBreak(150);
        this.addSectionTitle("Weekly Goals Summary");

        this.doc.fontSize(11).fillColor("#374151").font("Helvetica");

        weeks.slice(0, 8).forEach((week, index) => {
            this.checkPageBreak(40);

            this.doc
                .fillColor("#1e40af")
                .font("Helvetica-Bold")
                .text(`Week ${index + 1}: `, this.margin, this.currentY, { continued: true })
                .fillColor("#374151")
                .font("Helvetica")
                .text(`${week.weeklyGoal} (${week.totalWeeklyCalcHours}h)`);

            this.currentY += 18;
        });

        this.currentY += 20;
    }

    private addDetailedDailyPlanning(dailyBreakdown: DailyBreakdown[]): void {
        this.checkPageBreak(100);
        this.addSectionTitle("Detailed Daily Study Plan");

        this.doc.fontSize(10).fillColor("#6b7280").font("Helvetica").text("Each day shows exactly which videos, exercises, quizzes, and tests to complete.", this.margin, this.currentY);
        this.currentY += 25;

        let currentWeek = 0;

        dailyBreakdown.forEach((day, index) => {
            // Add week header when week changes
            if (day.weekNumber !== currentWeek) {
                currentWeek = day.weekNumber;
                this.checkPageBreak(80);

                this.doc.fillColor("#1e40af").font("Helvetica-Bold").fontSize(12).text(`Week ${currentWeek}`, this.margin, this.currentY);
                this.currentY += 20;
            }

            // Check space for day block (approximately 120 points for detailed content)
            this.checkPageBreak(120);

            // Day header
            this.doc.fillColor("#059669").font("Helvetica-Bold").fontSize(11).text(`${day.day}, ${day.date}`, this.margin, this.currentY);

            this.currentY += 16;

            // Topic and goal
            this.doc
                .fillColor("#374151")
                .font("Helvetica")
                .fontSize(10)
                .text(`Topic: ${day.calc2Topic}`, this.margin + 10, this.currentY);
            this.currentY += 14;

            // Clean up the goal text
            const cleanGoal = day.topicBreakdown
                .replace(/🔄 🔄 Work on: /, "Work on: ")
                .replace(/✅ Complete: /, "Complete: ")
                .replace(/📖 Continue: /, "Continue: ");

            this.doc.text(`Goal: ${cleanGoal}`, this.margin + 10, this.currentY, {
                width: this.pageWidth - 2 * this.margin - 20,
            });
            this.currentY += 14;

            // Unit
            const cleanUnit = day.unitTitle.replace("🔢 ", "").replace("🧮 ", "").replace("📐 ", "").replace("🎯 ", "").replace("📊 ", "").replace("∞ ", "");

            this.doc.text(`Unit: ${cleanUnit}`, this.margin + 10, this.currentY);
            this.currentY += 16;

            // Parse and display specific content items
            const scheduleItems = day.dailySchedule.split(" | ");
            const contentItem = scheduleItems.find((item) => item.includes("Today's Content:"));

            if (contentItem) {
                const content = contentItem.replace("📚 Today's Content: ", "");

                this.doc
                    .fillColor("#2563eb")
                    .font("Helvetica-Bold")
                    .fontSize(10)
                    .text("Today's Specific Content:", this.margin + 10, this.currentY);
                this.currentY += 14;

                // Parse individual content items
                const contentItems = content.split(" | ");
                contentItems.forEach((item) => {
                    if (item.trim()) {
                        this.checkPageBreak(15);

                        // Clean up content item text and add bullet points
                        let cleanItem = item.trim();

                        // Extract content type and format nicely
                        if (cleanItem.includes("Video:")) {
                            cleanItem = cleanItem.replace("Video:", "🎥 Video:");
                        } else if (cleanItem.includes("Exercise:")) {
                            cleanItem = cleanItem.replace("Exercise:", "📝 Exercise:");
                        } else if (cleanItem.includes("Article:")) {
                            cleanItem = cleanItem.replace("Article:", "📖 Article:");
                        } else if (cleanItem.includes("Quiz:") || cleanItem.includes("Topic quiz:")) {
                            cleanItem = cleanItem.replace("Quiz:", "📋 Quiz:").replace("Topic quiz:", "📋 Quiz:");
                        } else if (cleanItem.includes("Test:") || cleanItem.includes("Unit test:")) {
                            cleanItem = cleanItem.replace("Test:", "🎯 Test:").replace("Unit test:", "🎯 Test:");
                        }

                        this.doc
                            .fillColor("#374151")
                            .font("Helvetica")
                            .fontSize(9)
                            .text(`  • ${cleanItem}`, this.margin + 20, this.currentY, {
                                width: this.pageWidth - 2 * this.margin - 30,
                            });
                        this.currentY += 12;
                    }
                });
            } else {
                // Fallback if no content found
                this.doc
                    .fillColor("#6b7280")
                    .font("Helvetica")
                    .fontSize(9)
                    .text("Content: Review previous material", this.margin + 10, this.currentY);
                this.currentY += 12;
            }

            // Add daily schedule summary
            this.doc
                .fillColor("#6b7280")
                .font("Helvetica")
                .fontSize(8)
                .text("Schedule: 10-11 AM (Calculus 1h) | 2-4 PM (Deep Study 2h) | Video Editing: 11:30 AM & 4 PM", this.margin + 10, this.currentY, {
                    width: this.pageWidth - 2 * this.margin - 20,
                });
            this.currentY += 12;

            this.currentY += 8;

            // Add separator line every few days
            if ((index + 1) % 7 === 0 && index < dailyBreakdown.length - 1) {
                this.addHorizontalLine();
            }
        });

        this.currentY += 15;
    }

    private addMilestones(milestones: Milestone[]): void {
        this.checkPageBreak(150);
        this.addSectionTitle("Major Milestones");

        this.doc.fontSize(11).fillColor("#374151").font("Helvetica");

        milestones.forEach((milestone) => {
            this.checkPageBreak(35);

            this.doc.fillColor("#059669").font("Helvetica-Bold").text(`${milestone.date.toLocaleDateString()}: `, this.margin, this.currentY, { continued: true }).fillColor("#374151").font("Helvetica").text(`${milestone.description}`);

            this.currentY += 16;

            this.doc.fillColor("#6b7280").text(`   Progress: ${milestone.percentComplete}% (${milestone.hoursCompleted.toFixed(1)}h total)`, this.margin, this.currentY);

            this.currentY += 20;
        });

        this.currentY += 10;
    }

    private addSuccessStrategies(): void {
        this.checkPageBreak(200);
        this.addSectionTitle("Success Strategies");

        const strategies = [
            "Morning session (10-11am): Watch Khan Academy videos & take notes",
            "Afternoon session (2-4pm): Practice problems & work through exercises",
            "Take detailed notes and create summary sheets for each topic",
            "Complete all quizzes and tests as scheduled for proper assessment",
            "Review previous topics for 15 minutes each week",
            "Use Khan Academy mobile app during breaks for quick reviews",
            "Focus on understanding concepts, not just memorizing formulas",
            "Track your progress daily and adjust timeline if needed",
        ];

        this.doc.fontSize(11).fillColor("#374151").font("Helvetica");

        strategies.forEach((strategy) => {
            this.checkPageBreak(20);
            this.doc.text(`• ${strategy}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
            });
            this.currentY += 16;
        });

        this.currentY += 15;

        // Priority focus areas
        this.addSubsectionTitle("Priority Focus Areas");

        const priorities = ["Integration techniques and applications (highest priority)", "Sequences and series convergence tests", "Parametric equations and polar coordinate systems", "Differential equations and their applications", "Real-world applications of calculus concepts"];

        priorities.forEach((priority) => {
            this.checkPageBreak(18);
            this.doc.text(`• ${priority}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
            });
            this.currentY += 16;
        });
    }

    private addFooter(): void {
        this.currentY += 25;

        if (this.currentY < this.pageHeight - 80) {
            this.doc
                .fontSize(10)
                .fillColor("#9ca3af")
                .font("Helvetica")
                .text("Generated by Advanced Calculus 2 Planner - Detailed Daily Edition", this.margin, this.currentY, {
                    width: this.pageWidth - 2 * this.margin,
                    align: "center",
                });

            this.currentY += 15;

            this.doc.text("Complete with videos, exercises, quizzes, and tests for comprehensive learning!", this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: "center",
            });
        }
    }

    private addSectionTitle(title: string): void {
        this.checkPageBreak(60);

        this.doc.fontSize(14).fillColor("#1e40af").font("Helvetica-Bold").text(title, this.margin, this.currentY);

        this.currentY += 25;
    }

    private addSubsectionTitle(title: string): void {
        this.checkPageBreak(40);
        this.doc.fontSize(12).fillColor("#2563eb").font("Helvetica-Bold").text(title, this.margin, this.currentY);

        this.currentY += 20;
    }

    private addHorizontalLine(): void {
        this.doc
            .strokeColor("#e5e7eb")
            .lineWidth(1)
            .moveTo(this.margin, this.currentY)
            .lineTo(this.pageWidth - this.margin, this.currentY)
            .stroke();

        this.currentY += 15;
    }

    private checkPageBreak(neededSpace: number): void {
        if (this.currentY + neededSpace > this.pageHeight - 100) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }
}

export const generateStudyPlanPDF = async (studyPlan: StudyPlan, filename?: string): Promise<string> => {
    const generator = new StudyPlanPDFGenerator();
    return await generator.generatePDF(studyPlan, filename);
};
