import * as fs from "fs";
import { FormattedOutputWithSummary } from "../khanacademy/impl/types.js";
import { getContentForPath, formatKhanAcademyData, saveFormattedData, generateCourseSummary } from "../khanacademy/index.js";

// Types for the planner
export interface DateConstraint {
    start: Date;
    end: Date;
    type: "vacation" | "camping" | "school";
    description: string;
}

export interface DailyBreakdown {
    day: string;
    date: string;
    calc2Topic: string;
    topicBreakdown: string;
    unitTitle: string;
    weekNumber: number;
    studyHours: number;
}

export interface StudyPlan {
    totalStudyDays: number;
    calcStudyHoursPerDay: number;
    videoEditingHoursPerDay: number;
    totalCalcHoursNeeded: number;
    weeklySchedule: WeeklySchedule[];
    milestones: Milestone[];
    dailySchedule: DailyTimeBlock[];
    unitPlanning: UnitPlan[];
    dailyBreakdown: DailyBreakdown[];
}

export interface WeeklySchedule {
    weekStart: Date;
    weekEnd: Date;
    availableDays: number;
    targetUnit: string;
    topicsToComplete: string[];
    totalWeeklyCalcHours: number;
    weeklyGoal: string;
    notes: string[];
}

export interface Milestone {
    date: Date;
    description: string;
    hoursCompleted: number;
    percentComplete: number;
    unitsCompleted: string[];
}

export interface DailyTimeBlock {
    timeSlot: string;
    activity: string;
    duration: string;
    description: string;
}

export interface UnitPlan {
    unitNumber: number;
    unitTitle: string;
    topics: string[];
    estimatedHours: number;
    weekTarget: number;
    isCalc2Topic: boolean;
}

class AdvancedSummerPlanner {
    private constraints: DateConstraint[] = [];
    private khanAcademyData: { [key: string]: FormattedOutputWithSummary } = {};

    constructor() {
        this.setupConstraints();
    }

    private setupConstraints() {
        this.constraints = [
            {
                start: new Date("2024-07-23"),
                end: new Date("2024-08-07"),
                type: "vacation",
                description: "Summer Vacation",
            },
            {
                start: new Date("2024-09-14"),
                end: new Date("2024-09-17"),
                type: "camping",
                description: "Camping Trip",
            },
            {
                start: new Date("2024-09-21"),
                end: new Date("2024-12-31"),
                type: "school",
                description: "School Starts",
            },
        ];
    }

    async ensureDataExists(): Promise<void> {
        const calc2Path = "math-calculus-2.json";

        console.log("🔍 Checking for existing Calculus 2 data...");

        const calc2Valid = await this.isDataFileValid(calc2Path);

        if (!calc2Valid) {
            console.log("📥 Calculus 2 data missing or invalid. Generating...");
            await this.generateKhanAcademyData();
        } else {
            console.log("✅ Valid Calculus 2 data found.");
        }

        console.log("📖 Loading Calculus 2 data...");
        try {
            if (fs.existsSync(calc2Path)) {
                const calc2Data = JSON.parse(fs.readFileSync(calc2Path, "utf-8")) as FormattedOutputWithSummary;
                this.khanAcademyData["calculus-2"] = calc2Data;
                console.log(`📚 Loaded Calculus 2: ${calc2Data.course.units.length} units, ${calc2Data.summary.course.totalTopics} topics`);
            }
        } catch (error) {
            console.error("❌ Error loading Calculus 2 data:", error);
            console.log("💡 Tip: Try deleting the JSON file and running again to regenerate it.");
            throw error;
        }
    }

    private async isDataFileValid(filePath: string): Promise<boolean> {
        try {
            if (!fs.existsSync(filePath)) {
                return false;
            }

            const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

            const hasValidStructure = data.course && data.course.units && Array.isArray(data.course.units) && data.summary && data.summary.timeEstimate;

            if (!hasValidStructure) {
                console.log(`⚠️  ${filePath} exists but has invalid structure`);
                return false;
            }

            const stats = fs.statSync(filePath);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            if (stats.mtime < thirtyDaysAgo) {
                console.log(`⚠️  ${filePath} is older than 30 days, may need refreshing`);
            }

            return true;
        } catch (error) {
            console.log(`⚠️  ${filePath} exists but is corrupted: ${(error as Error).message}`);
            return false;
        }
    }

    private async generateKhanAcademyData(): Promise<void> {
        const course = { path: "math/calculus-2", filename: "math-calculus-2.json" };

        console.log(`🔄 Processing: ${course.path}`);
        try {
            const data = await getContentForPath(course.path, "US");
            const formattedData = await formatKhanAcademyData(data, course.path, "US", 50);
            const summary = generateCourseSummary(formattedData);

            const dataWithSummary: FormattedOutputWithSummary = {
                ...formattedData,
                summary,
            };

            saveFormattedData(dataWithSummary, course.filename);
            console.log(`✅ Generated: ${course.filename}`);
        } catch (error) {
            console.error(`❌ Error processing ${course.path}:`, error);
            throw error;
        }
    }

    private identifyCalc2Topics(): UnitPlan[] {
        console.log("🔍 Loading Calculus 2 curriculum...");

        const calc2Data = this.khanAcademyData["calculus-2"];
        if (!calc2Data) {
            throw new Error("Khan Academy Calculus 2 data not loaded properly");
        }

        const unitPlans: UnitPlan[] = [];

        calc2Data.course.units.forEach((unit, index) => {
            const topics = unit.topics.map((topic) => topic.title);
            const estimatedHours = Math.max(
                (unit.totalTimeEstimate?.totalMinutes || 0) / 60,
                topics.length * 2.5, // Minimum 2.5 hours per topic for thorough understanding
            );

            unitPlans.push({
                unitNumber: index + 1,
                unitTitle: unit.title,
                topics: topics,
                estimatedHours: Math.round(estimatedHours * 10) / 10,
                weekTarget: index + 1,
                isCalc2Topic: true, // All topics are Calc 2 topics now
            });
        });

        return unitPlans;
    }

    private getAvailableStudyDays(): { days: Date[]; totalDays: number } {
        // Set fixed start date to June 22nd
        const startDate = new Date("2025-06-22"); // Sunday, June 22, 2025
        const studyDays: Date[] = [];

        const currentYear = startDate.getFullYear();
        const adjustedSchoolStart = new Date(`${currentYear}-09-21`);
        const adjustedVacationStart = new Date(`${currentYear}-07-23`);
        const adjustedVacationEnd = new Date(`${currentYear}-08-07`);
        const adjustedCampingStart = new Date(`${currentYear}-09-14`);
        const adjustedCampingEnd = new Date(`${currentYear}-09-17`);

        const endDate = adjustedSchoolStart;
        const vacationStart = adjustedVacationStart;
        const vacationEnd = adjustedVacationEnd;
        const campingStart = adjustedCampingStart;
        const campingEnd = adjustedCampingEnd;

        for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
            let isAvailable = true;

            if (date >= vacationStart && date <= vacationEnd) {
                isAvailable = false;
            }

            if (date >= campingStart && date <= campingEnd) {
                isAvailable = false;
            }

            if (isAvailable) {
                studyDays.push(new Date(date));
            }
        }

        return { days: studyDays, totalDays: studyDays.length };
    }

    private createDailySchedule(): DailyTimeBlock[] {
        return [
            {
                timeSlot: "10:00 - 11:00 AM",
                activity: "Calculus 2 Study",
                duration: "1 hour",
                description: "Focus on current unit topics with Khan Academy videos and practice",
            },
            {
                timeSlot: "11:00 - 11:30 AM",
                activity: "Light Workout/Break",
                duration: "30 minutes",
                description: "Physical activity to refresh mind and body",
            },
            {
                timeSlot: "11:30 AM - 12:30 PM",
                activity: "Video Editing Work",
                duration: "1 hour",
                description: "Part-time job responsibilities",
            },
            {
                timeSlot: "12:30 - 2:00 PM",
                activity: "Lunch & Break",
                duration: "1.5 hours",
                description: "Meal time and personal break",
            },
            {
                timeSlot: "2:00 - 4:00 PM",
                activity: "Deep Calculus 2 Study",
                duration: "2 hours",
                description: "Problem solving, practice exercises, and concept reinforcement",
            },
            {
                timeSlot: "4:00 - 5:00 PM",
                activity: "Video Editing Work",
                duration: "1 hour",
                description: "Continue part-time job work",
            },
            {
                timeSlot: "Evening",
                activity: "Free Time/Review",
                duration: "Flexible",
                description: "Optional review or personal time",
            },
        ];
    }

    private optimizeSchedule(unitPlans: UnitPlan[], availableDays: number): StudyPlan {
        console.log("📅 Creating optimized study schedule for Calculus 2...");

        const totalCalcHours = unitPlans.reduce((sum, unit) => sum + unit.estimatedHours, 0);
        const calcHoursPerDay = 3; // 1 hour morning + 2 hours afternoon
        const videoEditingHoursPerDay = 2; // 1 hour + 1 hour as shown in schedule

        const { days: studyDays } = this.getAvailableStudyDays();
        const weeklySchedules = this.generateWeeklySchedules(studyDays, unitPlans);
        const milestones = this.generateDetailedMilestones(studyDays, unitPlans, calcHoursPerDay);
        const dailySchedule = this.createDailySchedule();
        const dailyBreakdown = this.generateDailyBreakdown(studyDays, unitPlans, calcHoursPerDay);

        return {
            totalStudyDays: availableDays,
            calcStudyHoursPerDay: calcHoursPerDay,
            videoEditingHoursPerDay: videoEditingHoursPerDay,
            totalCalcHoursNeeded: totalCalcHours,
            weeklySchedule: weeklySchedules,
            milestones: milestones,
            dailySchedule: dailySchedule,
            unitPlanning: unitPlans,
            dailyBreakdown: dailyBreakdown,
        };
    }

    private generateWeeklySchedules(studyDays: Date[], unitPlans: UnitPlan[]): WeeklySchedule[] {
        const weeks: WeeklySchedule[] = [];
        const startDate = studyDays[0];
        const calcHoursPerDay = 3;

        const currentWeekStart = new Date(startDate);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

        let unitIndex = 0;
        let weekNumber = 1;

        while (currentWeekStart < studyDays[studyDays.length - 1] && unitIndex < unitPlans.length) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekDays = studyDays.filter((day) => day >= currentWeekStart && day <= weekEnd);
            const availableDays = weekDays.length;

            const currentUnit = unitPlans[unitIndex];
            const weeklyHours = availableDays * calcHoursPerDay;

            const notes: string[] = [];
            if (availableDays < 7) {
                notes.push(`Only ${availableDays} study days this week due to constraints`);
            }

            // Determine topics to complete this week
            const hoursPerTopic = currentUnit.estimatedHours / currentUnit.topics.length;
            const topicsThisWeek = Math.min(Math.floor(weeklyHours / hoursPerTopic), currentUnit.topics.length);

            weeks.push({
                weekStart: new Date(currentWeekStart),
                weekEnd: new Date(weekEnd),
                availableDays,
                targetUnit: `Unit ${currentUnit.unitNumber}: ${currentUnit.unitTitle}`,
                topicsToComplete: currentUnit.topics.slice(0, topicsThisWeek),
                totalWeeklyCalcHours: weeklyHours,
                weeklyGoal: `Complete ${topicsThisWeek} topics from ${currentUnit.unitTitle}`,
                notes,
            });

            // Move to next unit after estimated completion
            if (weekNumber >= Math.ceil(currentUnit.estimatedHours / weeklyHours)) {
                unitIndex++;
                weekNumber = 1;
            } else {
                weekNumber++;
            }

            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        return weeks;
    }

    private generateDetailedMilestones(studyDays: Date[], unitPlans: UnitPlan[], hoursPerDay: number): Milestone[] {
        const milestones: Milestone[] = [];

        if (studyDays.length === 0) {
            console.log("⚠️  No study days available for milestones");
            return [];
        }

        let cumulativeHours = 0;
        let dayIndex = 0;

        unitPlans.forEach((unit, index) => {
            const daysNeeded = Math.ceil(unit.estimatedHours / hoursPerDay);
            dayIndex = Math.min(dayIndex + daysNeeded, studyDays.length - 1);
            cumulativeHours += unit.estimatedHours;

            const completedUnits = unitPlans.slice(0, index + 1).map((u) => u.unitTitle);
            const totalHours = unitPlans.reduce((sum, u) => sum + u.estimatedHours, 0);
            const percentComplete = Math.round((cumulativeHours / totalHours) * 100);

            if (studyDays[dayIndex]) {
                milestones.push({
                    date: studyDays[dayIndex],
                    description: `Complete ${unit.unitTitle}`,
                    hoursCompleted: cumulativeHours,
                    percentComplete: percentComplete,
                    unitsCompleted: completedUnits,
                });
            }
        });

        return milestones;
    }

    private generateDailyBreakdown(studyDays: Date[], unitPlans: UnitPlan[], hoursPerDay: number): DailyBreakdown[] {
        const dailyBreakdown: DailyBreakdown[] = [];

        if (studyDays.length === 0) {
            return dailyBreakdown;
        }

        let currentUnitIndex = 0;
        let currentTopicIndex = 0;
        let hoursSpentOnCurrentTopic = 0;
        let weekNumber = 1;
        let lastWeekStart = new Date(studyDays[0]);
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay()); // Start of week

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        studyDays.forEach((day) => {
            // Check if we've moved to a new week
            const currentWeekStart = new Date(day);
            currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

            if (currentWeekStart.getTime() !== lastWeekStart.getTime()) {
                weekNumber++;
                lastWeekStart = currentWeekStart;
            }

            // Get current unit and topic
            if (currentUnitIndex >= unitPlans.length) {
                currentUnitIndex = unitPlans.length - 1; // Stay on last unit
            }

            const currentUnit = unitPlans[currentUnitIndex];
            const currentTopic = currentUnit.topics[currentTopicIndex] || currentUnit.topics[currentUnit.topics.length - 1];

            // Calculate hours per topic (roughly)
            const hoursPerTopic = currentUnit.estimatedHours / currentUnit.topics.length;

            // Create topic breakdown for the day
            let topicBreakdown = "";
            if (hoursPerDay <= hoursPerTopic) {
                // Single topic for the day
                const progressPercent = Math.min(100, Math.round(((hoursSpentOnCurrentTopic + hoursPerDay) / hoursPerTopic) * 100));
                topicBreakdown = `Continue: ${currentTopic} (${progressPercent}% complete)`;
            } else {
                // Multiple topics or complete a topic
                const remainingHoursForTopic = Math.max(0, hoursPerTopic - hoursSpentOnCurrentTopic);
                if (remainingHoursForTopic <= hoursPerDay) {
                    topicBreakdown = `Complete: ${currentTopic} + Start next topic`;
                } else {
                    topicBreakdown = `Work on: ${currentTopic} (${Math.round((hoursSpentOnCurrentTopic / hoursPerTopic) * 100)}% → ${Math.round(((hoursSpentOnCurrentTopic + hoursPerDay) / hoursPerTopic) * 100)}%)`;
                }
            }

            dailyBreakdown.push({
                day: daysOfWeek[day.getDay()],
                date: day.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                calc2Topic: currentTopic,
                topicBreakdown: topicBreakdown,
                unitTitle: currentUnit.unitTitle,
                weekNumber: weekNumber,
                studyHours: hoursPerDay,
            });

            // Update progress tracking
            hoursSpentOnCurrentTopic += hoursPerDay;

            // Check if we should move to next topic
            if (hoursSpentOnCurrentTopic >= hoursPerTopic) {
                currentTopicIndex++;
                hoursSpentOnCurrentTopic = 0;

                // Check if we should move to next unit
                if (currentTopicIndex >= currentUnit.topics.length) {
                    currentUnitIndex++;
                    currentTopicIndex = 0;
                }
            }
        });

        return dailyBreakdown;
    }

    async generatePlan(): Promise<StudyPlan> {
        console.log("🚀 Generating Calculus 2 Summer Study Planner...\n");

        await this.ensureDataExists();
        const unitPlans = this.identifyCalc2Topics();
        const { totalDays } = this.getAvailableStudyDays();
        const studyPlan = this.optimizeSchedule(unitPlans, totalDays);

        this.displayDetailedPlan(studyPlan);
        this.displayDailyBreakdownTable(studyPlan.dailyBreakdown);
        return studyPlan;
    }

    private displayDetailedPlan(plan: StudyPlan) {
        console.log("📊 DETAILED CALCULUS 2 SUMMER STUDY PLAN");
        console.log("═══════════════════════════════════════════════════════");

        console.log("\n🎯 CALCULUS 2 CURRICULUM (Khan Academy):");
        plan.unitPlanning.forEach((unit, index) => {
            console.log(`${index + 1}. ${unit.unitTitle}`);
            console.log(`   ⏱️  Estimated Time: ${unit.estimatedHours} hours`);
            console.log(`   📚 Topics: ${unit.topics.length} topics`);
            console.log(`   🎯 Target Week: ${unit.weekTarget}`);
        });

        const totalHours = plan.unitPlanning.reduce((sum, unit) => sum + unit.estimatedHours, 0);
        console.log(`\n📊 TOTAL CALCULUS 2 STUDY TIME: ${totalHours} hours`);
        console.log(`📅 AVAILABLE STUDY DAYS: ${plan.totalStudyDays} days`);

        console.log("\n⏰ DAILY SCHEDULE TEMPLATE:");
        plan.dailySchedule.forEach((block) => {
            console.log(`${block.timeSlot.padEnd(20)} | ${block.activity.padEnd(25)} | ${block.description}`);
        });

        console.log("\n📅 WEEKLY GOALS & TARGETS:");
        plan.weeklySchedule.slice(0, 6).forEach((week, index) => {
            console.log(`\n📆 Week ${index + 1} (${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()})`);
            console.log(`   🎯 Goal: ${week.weeklyGoal}`);
            console.log(`   📚 Unit: ${week.targetUnit}`);
            console.log(`   ⏱️  Study Hours: ${week.totalWeeklyCalcHours}h (${week.availableDays} days × 3h/day)`);
            console.log(`   📋 Topics to Complete: ${week.topicsToComplete.slice(0, 3).join(", ")}${week.topicsToComplete.length > 3 ? "..." : ""}`);
            if (week.notes.length > 0) {
                console.log(`   ⚠️  Notes: ${week.notes.join(", ")}`);
            }
        });

        console.log("\n🎯 MAJOR MILESTONES:");
        plan.milestones.forEach((milestone) => {
            console.log(`📅 ${milestone.date.toLocaleDateString()}: ${milestone.description}`);
            console.log(`   ✅ Progress: ${milestone.percentComplete}% (${milestone.hoursCompleted.toFixed(1)}h total)`);
        });

        console.log("\n💡 SUCCESS STRATEGIES:");
        console.log("• 📖 Morning session (10-11am): Watch Khan Academy videos & take notes");
        console.log("• 🧠 Afternoon session (2-4pm): Practice problems & work through exercises");
        console.log("• 📝 Take detailed notes and create summary sheets for each topic");
        console.log("• 🔄 Review previous topics for 15 minutes each week");
        console.log("• 📱 Use Khan Academy mobile app during breaks for quick reviews");
        console.log("• 🎯 Focus on understanding concepts, not just memorizing formulas");
        console.log("• 📊 Track your progress and adjust timeline if needed");

        console.log("\n⚡ CALCULUS 2 FOCUS AREAS:");
        console.log("• Integration techniques and methods");
        console.log("• Applications of integrals");
        console.log("• Infinite sequences and series");
        console.log("• Parametric equations and polar coordinates");
        console.log("• Differential equations basics");
    }

    private displayDailyBreakdownTable(dailyBreakdown: DailyBreakdown[]) {
        console.log("\n📅 DAILY BREAKDOWN TABLE");
        console.log("═══════════════════════════════════════════════════════");
        console.log("✨ Enhanced format with emojis and progress tracking!\n");

        // Show first few rows as preview
        console.log("📋 PREVIEW (First 5 days):");
        console.log("📅 Day\t📆 Date\t📚 Topic\t🎯 Daily Goal\t📖 Unit");
        console.log("───────\t────────\t──────────\t─────────────\t──────────");

        dailyBreakdown.slice(0, 5).forEach((day) => {
            const enhancedGoal = day.topicBreakdown.replace("Complete: ", "✅ Master: ").replace("Continue: ", "📖 Continue: ").replace("Work on: ", "🔄 Work on: ").replace(" + Start next topic", " → Next");

            const formattedUnit = day.unitTitle
                .replace("Integrals review", "🔢 Integrals")
                .replace("Integration techniques", "🧮 Integration")
                .replace("Differential equations", "📐 Diff Eq")
                .replace("Applications of integrals", "🎯 Applications")
                .replace("Parametric equations, polar coordinates, and vector-valued functions", "📊 Parametric")
                .replace("Series", "∞ Series");

            const shortGoal = enhancedGoal.length > 35 ? enhancedGoal.substring(0, 32) + "..." : enhancedGoal;
            console.log(`${day.day}\t${day.date}\t${day.calc2Topic.substring(0, 25)}...\t${shortGoal}\t${formattedUnit}`);
        });

        if (dailyBreakdown.length > 5) {
            console.log(`... and ${dailyBreakdown.length - 5} more days`);
        }

        console.log("\n📊 TABLE SUMMARY:");
        console.log(`• 📅 Total study days: ${dailyBreakdown.length}`);
        console.log(`• ⏰ Total study hours: ${dailyBreakdown.reduce((sum, day) => sum + day.studyHours, 0)} hours`);
        console.log(`• 📈 Study period: ${dailyBreakdown[0]?.date} → ${dailyBreakdown[dailyBreakdown.length - 1]?.date}`);

        console.log("\n✨ ENHANCED FEATURES:");
        console.log("• 📅 Emoji column headers for easy identification");
        console.log("• 🎯 Action-oriented daily goals (Master, Continue, Work on)");
        console.log("• 📊 Progress percentages for motivation");
        console.log("• ☐ Checkboxes for completion tracking");
        console.log("• 🎨 Color-coded unit names with emojis");

        console.log("\n💡 GET THE PROFESSIONAL EXCEL FILE:");
        console.log("🚀 Run: bun src/index.ts excel");
        console.log("📁 Creates a beautifully formatted .xlsx file with no encoding issues!");
    }
}

export const createAdvancedSummerPlan = async (): Promise<StudyPlan> => {
    const planner = new AdvancedSummerPlanner();
    return await planner.generatePlan();
};

if (import.meta.main) {
    createAdvancedSummerPlan().catch(console.error);
}
