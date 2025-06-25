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
    dailySchedule: string;
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
    topicDetails: TopicDetail[];
}

export interface TopicDetail {
    title: string;
    estimatedHours: number;
    contentCount: number;
    videoCount: number;
    videoDurationMinutes: number;
    contents: ContentItem[];
}

export interface ContentItem {
    id: string;
    title: string;
    contentKind: string;
    estimatedMinutes: number;
    url?: string;
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

            // Create detailed topic information with realistic time estimates
            const topicDetails: TopicDetail[] = unit.topics.map((topic) => {
                const videoCount = topic.contents.filter((content) => content.contentKind === "Video").length;
                const exerciseCount = topic.contents.filter((content) => content.contentKind === "Exercise").length;
                const videoDurationMinutes = topic.contents.filter((content) => content.contentKind === "Video").reduce((sum, content) => sum + (content.videoMetadata?.durationMinutes || 0), 0);

                // Create detailed content breakdown
                const contents: ContentItem[] = topic.contents.map((content) => {
                    let estimatedMinutes: number;

                    // First, try to use Khan Academy's provided time estimate
                    if (content.timeEstimate?.totalMinutes && content.timeEstimate.totalMinutes > 0) {
                        estimatedMinutes = content.timeEstimate.totalMinutes;
                    } else if (content.timeEstimate?.averageMinutes && content.timeEstimate.averageMinutes > 0) {
                        estimatedMinutes = content.timeEstimate.averageMinutes;
                    } else {
                        // Fall back to our content-type-based estimates
                        if (content.contentKind === "Video") {
                            estimatedMinutes = (content.videoMetadata?.durationMinutes || 5) * 1.5; // Video + note-taking time
                        } else if (content.contentKind === "Exercise") {
                            estimatedMinutes = 18; // Average exercise time
                        } else if (content.contentKind === "Article") {
                            estimatedMinutes = 10; // Reading time
                        } else if (content.contentKind === "Topic quiz") {
                            estimatedMinutes = 25; // Quiz completion + review time
                        } else if (content.contentKind === "Topic unit test") {
                            estimatedMinutes = 45; // Unit test completion + review time
                        } else if (content.contentKind === "Quiz") {
                            estimatedMinutes = 20; // General quiz time
                        } else if (content.contentKind === "Test") {
                            estimatedMinutes = 40; // General test time
                        } else if (content.contentKind === "Assessment") {
                            estimatedMinutes = 30; // Assessment time
                        } else if (content.contentKind === "Practice") {
                            estimatedMinutes = 15; // Practice time
                        } else {
                            estimatedMinutes = 15; // Other content types
                        }
                    }

                    return {
                        id: content.id,
                        title: content.title,
                        contentKind: content.contentKind,
                        estimatedMinutes: Math.round(estimatedMinutes * 10) / 10,
                        url: content.url,
                    };
                });

                // Check if this is a quiz or test topic (empty contents array)
                if (topic.contents.length === 0 && (topic.title.includes("Quiz") || topic.title.includes("Unit test"))) {
                    const isUnitTest = topic.title.includes("Unit test");
                    const estimatedMinutes = isUnitTest ? 45 : 25;
                    const contentKind = isUnitTest ? "Topic unit test" : "Topic quiz";

                    // Add the assessment as a content item
                    contents.push({
                        id: topic.id,
                        title: topic.title,
                        contentKind: contentKind,
                        estimatedMinutes: estimatedMinutes,
                        url: topic.url || "",
                    });
                }

                // More realistic time estimation based on content
                let topicHours: number;
                if (topic.totalTimeEstimate?.totalMinutes && topic.totalTimeEstimate.totalMinutes > 0) {
                    // Use Khan Academy's topic-level estimate if available
                    topicHours = topic.totalTimeEstimate.totalMinutes / 60;
                } else if (topic.totalTimeEstimate?.averageMinutes && topic.totalTimeEstimate.averageMinutes > 0) {
                    // Use average estimate if total not available
                    topicHours = topic.totalTimeEstimate.averageMinutes / 60;
                } else {
                    // Calculate based on individual content items (which now includes assessments)
                    const totalMinutes = contents.reduce((sum, content) => sum + content.estimatedMinutes, 0);
                    topicHours = totalMinutes / 60;

                    // Minimum and maximum bounds for realistic study times
                    if (contents.length === 1 && (contents[0].contentKind === "Topic quiz" || contents[0].contentKind === "Topic unit test")) {
                        // Quiz or test only topics - use the assessment time
                        topicHours = contents[0].estimatedMinutes / 60;
                    } else if (videoCount === 0 && exerciseCount === 0 && contents.length > 0) {
                        // Other assessment topics
                        topicHours = Math.max(0.5, topicHours);
                    } else if (contents.length > 0) {
                        // Regular content topics
                        topicHours = Math.max(1.0, Math.min(4.0, topicHours));
                    } else {
                        // Empty topics (shouldn't happen now)
                        topicHours = 0;
                    }
                }

                return {
                    title: topic.title,
                    estimatedHours: Math.round(topicHours * 10) / 10,
                    contentCount: contents.length,
                    videoCount: videoCount,
                    videoDurationMinutes: Math.round(videoDurationMinutes * 10) / 10,
                    contents: contents,
                };
            });

            // Calculate total unit hours from actual topic estimates
            const totalHours = topicDetails.reduce((sum, topic) => sum + topic.estimatedHours, 0);

            unitPlans.push({
                unitNumber: index + 1,
                unitTitle: unit.title,
                topics: topics,
                estimatedHours: Math.round(totalHours * 10) / 10,
                weekTarget: index + 1,
                isCalc2Topic: true, // All topics are Calc 2 topics now
                topicDetails: topicDetails,
            });
        });

        // Don't scale down - we'll distribute evenly instead
        return unitPlans;
    }

    private getAvailableStudyDays(): { days: Date[]; totalDays: number } {
        // Set fixed start date to June 23rd (Monday) to avoid starting on Sunday
        const startDate = new Date("2025-06-23"); // Monday, June 23, 2025
        const studyDays: Date[] = [];

        const currentYear = startDate.getFullYear();
        const adjustedVacationStart = new Date(`${currentYear}-07-23`);
        const adjustedVacationEnd = new Date(`${currentYear}-08-07`);
        const adjustedCampingStart = new Date(`${currentYear}-09-14`);

        // End study one week before school starts (Sept 21) for buffer week
        // This means we finish on September 14th (before camping trip)
        const endDate = adjustedCampingStart; // End on September 14th
        const vacationStart = adjustedVacationStart;
        const vacationEnd = adjustedVacationEnd;

        for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
            let isAvailable = true;

            // Skip Sundays (getDay() returns 0 for Sunday)
            if (date.getDay() === 0) {
                isAvailable = false;
            }

            // Only check vacation constraint since we end before camping trip
            if (date >= vacationStart && date <= vacationEnd) {
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
        const startDate = studyDays[0]; // June 22, 2025 (Sunday)
        const calcHoursPerDay = 3;

        // Start from the actual study start date, not the calendar week
        const currentWeekStart = new Date(startDate);
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

        // Create a flattened list of all content items with their time requirements
        const allContentItems: Array<{
            unitIndex: number;
            topicIndex: number;
            contentIndex: number;
            unitTitle: string;
            topicTitle: string;
            contentItem: ContentItem;
            remainingMinutes: number;
        }> = [];

        unitPlans.forEach((unit, unitIndex) => {
            unit.topicDetails.forEach((topic, topicIndex) => {
                topic.contents.forEach((content, contentIndex) => {
                    allContentItems.push({
                        unitIndex,
                        topicIndex,
                        contentIndex,
                        unitTitle: unit.unitTitle,
                        topicTitle: topic.title,
                        contentItem: content,
                        remainingMinutes: content.estimatedMinutes,
                    });
                });
            });
        });

        // Calculate total content time and distribute evenly across study days
        const totalContentMinutes = allContentItems.reduce((sum, item) => sum + item.contentItem.estimatedMinutes, 0);
        const minutesPerDay = hoursPerDay * 60;
        const totalAvailableMinutes = studyDays.length * minutesPerDay;

        // Instead of scaling, distribute content evenly by adjusting pace
        console.log(`📊 Content distribution: ${totalContentMinutes} minutes of content across ${studyDays.length} days (${totalAvailableMinutes} minutes available)`);

        // Calculate target pace: how much content per day to use all available time
        const targetContentPerDay = totalContentMinutes / studyDays.length;
        const paceAdjustment = targetContentPerDay / minutesPerDay;

        console.log(`⚖️  Adjusting pace: targeting ${Math.round(targetContentPerDay)} minutes of content per day (${Math.round(paceAdjustment * 100)}% of daily time)`);

        let currentContentIndex = 0;
        let weekNumber = 1;
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        studyDays.forEach((day, index) => {
            // Check if we've moved to a new week (every 7 days from start)
            const daysSinceStart = Math.floor(index / 7);
            const currentWeekNumber = daysSinceStart + 1;

            if (currentWeekNumber !== weekNumber) {
                weekNumber = currentWeekNumber;
            }

            // Use adaptive daily minutes based on remaining content and days
            const remainingDays = studyDays.length - index;
            const remainingContentMinutes = allContentItems.slice(currentContentIndex).reduce((sum, item) => sum + item.remainingMinutes, 0);
            const adaptiveDailyMinutes = remainingDays > 0 ? Math.min(minutesPerDay, Math.max(60, remainingContentMinutes / remainingDays)) : minutesPerDay;

            let remainingDailyMinutes = adaptiveDailyMinutes;
            const contentForDay: Array<{
                topicTitle: string;
                contentTitle: string;
                contentKind: string;
                minutesSpent: number;
                isPartial: boolean;
                partNumber?: number;
                totalParts?: number;
            }> = [];

            let currentTopic = "";
            let currentUnit = "";

            // Distribute content across the day
            while (remainingDailyMinutes > 5 && currentContentIndex < allContentItems.length) {
                const contentItem = allContentItems[currentContentIndex];
                const minutesToSpend = Math.min(remainingDailyMinutes, contentItem.remainingMinutes);

                if (minutesToSpend > 0) {
                    const isPartial = contentItem.remainingMinutes > minutesToSpend;
                    let partInfo = {};

                    if (isPartial) {
                        // Calculate part information for partial content
                        const totalParts = Math.ceil(contentItem.contentItem.estimatedMinutes / 30); // 30-minute chunks
                        const currentPart = Math.ceil((contentItem.contentItem.estimatedMinutes - contentItem.remainingMinutes + minutesToSpend) / 30);
                        partInfo = {
                            isPartial: true,
                            partNumber: currentPart,
                            totalParts: totalParts,
                        };
                    }

                    contentForDay.push({
                        topicTitle: contentItem.topicTitle,
                        contentTitle: contentItem.contentItem.title,
                        contentKind: contentItem.contentItem.contentKind,
                        minutesSpent: minutesToSpend,
                        isPartial,
                        ...partInfo,
                    });

                    contentItem.remainingMinutes -= minutesToSpend;
                    remainingDailyMinutes -= minutesToSpend;

                    // Set current topic and unit for display
                    if (!currentTopic) {
                        currentTopic = contentItem.topicTitle;
                        currentUnit = contentItem.unitTitle;
                    }
                }

                // Move to next content item if current one is completed
                if (contentItem.remainingMinutes <= 1) {
                    currentContentIndex++;
                }

                // Break if we can't make more progress
                if (minutesToSpend === 0) {
                    break;
                }
            }

            // Create topic breakdown description
            let topicBreakdown = "";
            if (contentForDay.length === 0) {
                topicBreakdown = "📖 Review previous topics";
            } else if (contentForDay.length === 1) {
                const content = contentForDay[0];
                if (content.isPartial) {
                    topicBreakdown = `📖 Work on: ${content.topicTitle} Part ${content.partNumber}/${content.totalParts} - ${content.contentTitle}`;
                } else {
                    topicBreakdown = `✅ Complete: ${content.contentTitle} (${content.contentKind})`;
                }
            } else {
                const mainTopic = contentForDay[0].topicTitle;
                const sameTopicCount = contentForDay.filter((c) => c.topicTitle === mainTopic).length;

                if (sameTopicCount === contentForDay.length) {
                    // All content from same topic
                    topicBreakdown = `🔄 Work on: ${mainTopic} (${contentForDay.length} items)`;
                } else {
                    // Mixed topics
                    const topics = [...new Set(contentForDay.map((c) => c.topicTitle))];
                    if (topics.length <= 2) {
                        topicBreakdown = `🔄 Work on: ${topics.join(" + ")}`;
                    } else {
                        topicBreakdown = `🔄 Work on: ${topics[0]} + ${topics.length - 1} more topics`;
                    }
                }
            }

            // Create detailed daily schedule with specific content
            const contentList = contentForDay
                .map((content) => {
                    const duration = `${Math.round(content.minutesSpent)}min`;
                    const partInfo = content.isPartial ? ` (Part ${content.partNumber}/${content.totalParts})` : "";
                    return `${content.contentKind}: ${content.contentTitle}${partInfo} [${duration}]`;
                })
                .join(" | ");

            const dailySchedule = [
                "10:00-11:00 AM: Calculus 2 Study (1h) - Khan Academy videos & notes",
                "11:00-11:30 AM: Light Workout/Break (30min)",
                "11:30 AM-12:30 PM: Video Editing Work (1h)",
                "12:30-2:00 PM: Lunch & Break (1.5h)",
                "2:00-4:00 PM: Deep Calculus 2 Study (2h) - Practice problems",
                "4:00-5:00 PM: Video Editing Work (1h)",
                "Evening: Free Time/Review",
                `📚 Today's Content: ${contentList || "Review previous material"}`,
            ].join(" | ");

            dailyBreakdown.push({
                day: daysOfWeek[day.getDay()],
                date: day.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                calc2Topic: currentTopic || "Review",
                topicBreakdown: topicBreakdown,
                unitTitle: currentUnit || "Review",
                weekNumber: weekNumber,
                studyHours: hoursPerDay,
                dailySchedule: dailySchedule,
            });
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
            // Calculate content type breakdown for this unit
            const unitVideos = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Video").length, 0);
            const unitExercises = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Exercise").length, 0);
            const unitQuizzes = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length, 0);
            const unitTests = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length, 0);
            const unitArticles = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => c.contentKind === "Article").length, 0);
            const unitOther = unit.topicDetails.reduce((sum, topic) => sum + topic.contents.filter((c) => !["Video", "Exercise", "Article", "Topic quiz", "Quiz", "Topic unit test", "Test"].includes(c.contentKind)).length, 0);

            console.log(`${index + 1}. ${unit.unitTitle}`);
            console.log(`   ⏱️  Estimated Time: ${unit.estimatedHours} hours`);
            console.log(`   📚 Topics: ${unit.topics.length} topics`);
            console.log(`   🎯 Target Week: ${unit.weekTarget}`);

            // Show detailed content breakdown
            console.log(`   📊 Content Breakdown:`);
            if (unitVideos > 0) console.log(`      🎥 Videos: ${unitVideos}`);
            if (unitExercises > 0) console.log(`      📝 Exercises: ${unitExercises}`);
            if (unitArticles > 0) console.log(`      📖 Articles: ${unitArticles}`);
            if (unitQuizzes > 0) console.log(`      📋 Quizzes: ${unitQuizzes}`);
            if (unitTests > 0) console.log(`      🎯 Tests: ${unitTests}`);
            if (unitOther > 0) console.log(`      📄 Other: ${unitOther}`);

            // Show topic-level breakdown for better understanding
            const topTopics = unit.topicDetails.slice(0, 2);
            if (topTopics.length > 0) {
                console.log("   📋 Key Topics:");
                topTopics.forEach((topic) => {
                    const topicQuizzes = topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length;
                    const topicTests = topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length;
                    const assessmentInfo = topicQuizzes > 0 || topicTests > 0 ? ` [${topicQuizzes} quizzes, ${topicTests} tests]` : "";
                    console.log(`      • ${topic.title} (${topic.estimatedHours}h, ${topic.videoCount} videos${assessmentInfo})`);
                });
                if (unit.topicDetails.length > 2) {
                    console.log(`      ... and ${unit.topicDetails.length - 2} more topics`);
                }
            }
        });

        const totalHours = plan.unitPlanning.reduce((sum, unit) => sum + unit.estimatedHours, 0);

        // Calculate comprehensive content statistics
        const totalVideos = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Video").length, 0), 0);
        const totalExercises = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Exercise").length, 0), 0);
        const totalQuizzes = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic quiz" || c.contentKind === "Quiz").length, 0), 0);
        const totalTests = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Topic unit test" || c.contentKind === "Test").length, 0), 0);
        const totalArticles = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.filter((c) => c.contentKind === "Article").length, 0), 0);
        const totalContent = plan.unitPlanning.reduce((sum, unit) => sum + unit.topicDetails.reduce((topicSum, topic) => topicSum + topic.contents.length, 0), 0);

        console.log(`\n📊 COMPREHENSIVE CONTENT BREAKDOWN:`);
        console.log(`   📚 Total Content Items: ${totalContent}`);
        console.log(`   🎥 Videos: ${totalVideos} (includes Khan Academy video lessons)`);
        console.log(`   📝 Exercises: ${totalExercises} (practice problems and drills)`);
        console.log(`   📖 Articles: ${totalArticles} (reading materials and explanations)`);
        console.log(`   📋 Quizzes: ${totalQuizzes} (topic assessments and reviews)`);
        console.log(`   🎯 Tests: ${totalTests} (unit tests and comprehensive assessments)`);

        console.log(`\n📊 TOTAL CALCULUS 2 STUDY TIME: ${totalHours} hours`);
        console.log(`📅 AVAILABLE STUDY DAYS: ${plan.totalStudyDays} days`);
        console.log(`⚡ ENHANCED FEATURES: Now includes proper time allocation for quizzes (25min) and tests (45min)!`);

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
        console.log("• 🎉 BUFFER WEEK: Finish Sept 14th - Full week before school for final review!");

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
        console.log("📋 DETAILED DAILY SCHEDULE PREVIEW (First 3 days):");
        console.log("═".repeat(80));

        dailyBreakdown.slice(0, 3).forEach((day, index) => {
            const enhancedGoal = day.topicBreakdown.replace("Complete: ", "✅ Master: ").replace("Continue: ", "📖 Continue: ").replace("Work on: ", "🔄 Work on: ").replace(" + Start next topic", " → Next");

            const formattedUnit = day.unitTitle
                .replace("Integrals review", "🔢 Integrals Review")
                .replace("Integration techniques", "🧮 Integration Techniques")
                .replace("Differential equations", "📐 Differential Equations")
                .replace("Applications of integrals", "🎯 Applications of Integrals")
                .replace("Parametric equations, polar coordinates, and vector-valued functions", "📊 Parametric & Polar")
                .replace("Series", "∞ Infinite Series");

            console.log(`\n📅 ${day.day}, ${day.date} - Week ${day.weekNumber}`);
            console.log(`📚 Topic: ${day.calc2Topic}`);
            console.log(`🎯 Goal: ${enhancedGoal}`);
            console.log(`📖 Unit: ${formattedUnit}`);
            console.log(`⏰ DAILY SCHEDULE:`);

            const scheduleItems = day.dailySchedule.split(" | ");
            scheduleItems.forEach((item) => {
                console.log(`   ${item}`);
            });

            if (index < 2) console.log("─".repeat(60));
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

        console.log("\n💡 GET THE COMPREHENSIVE EXCEL FILE:");
        console.log("🚀 Run: bun src/index.ts excel");
        console.log("📁 Creates a professionally formatted .xlsx file with:");
        console.log("   • Daily study schedule with progress tracking");
        console.log("   • Study plan summary with key metrics");
        console.log("   • 🆕 DETAILED CONTENT BREAKDOWN: Every video, exercise, quiz & test!");
        console.log("   • Direct Khan Academy URLs for each content item");
        console.log("   • Time estimates and completion tracking");
        console.log("   • Color-coded content types and unit organization");
    }
}

export const createAdvancedSummerPlan = async (): Promise<StudyPlan> => {
    const planner = new AdvancedSummerPlanner();
    return await planner.generatePlan();
};

if (import.meta.main) {
    createAdvancedSummerPlan().catch(console.error);
}
