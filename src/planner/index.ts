import * as fs from 'fs';
import { FormattedOutputWithSummary } from '../khanacademy/impl/types.js';
import { getContentForPath, formatKhanAcademyData, saveFormattedData, generateCourseSummary } from '../khanacademy/index.js';

// Types for the planner
interface DateConstraint {
    start: Date;
    end: Date;
    type: 'vacation' | 'camping' | 'school';
    description: string;
}

interface DailyCommitment {
    activity: string;
    hoursPerDay: number;
    priority: 'high' | 'medium' | 'low';
}

interface StudyPlan {
    totalStudyDays: number;
    calculsStudyHoursPerDay: number;
    videoEditingHoursPerDay: number;
    totalCalcHoursNeeded: number;
    weeklySchedule: WeeklySchedule[];
    milestones: Milestone[];
}

interface WeeklySchedule {
    weekStart: Date;
    weekEnd: Date;
    availableDays: number;
    calcHoursPerDay: number;
    videoEditingHours: number;
    totalWeeklyCalcHours: number;
    notes: string[];
}

interface Milestone {
    date: Date;
    description: string;
    hoursCompleted: number;
    percentComplete: number;
}

class AdvancedSummerPlanner {
    private constraints: DateConstraint[] = [];
    private dailyCommitments: DailyCommitment[] = [];
    private khanAcademyData: { [key: string]: FormattedOutputWithSummary } = {};

    constructor() {
        this.setupConstraints();
        this.setupDailyCommitments();
    }

    private setupConstraints() {
        // Based on user's specified constraints
        this.constraints = [
            {
                start: new Date('2024-07-23'),
                end: new Date('2024-08-07'),
                type: 'vacation',
                description: 'Summer Vacation'
            },
            {
                start: new Date('2024-09-14'),
                end: new Date('2024-09-17'),
                type: 'camping',
                description: 'Camping Trip'
            },
            {
                start: new Date('2024-09-21'),
                end: new Date('2024-12-31'), // Assuming school year
                type: 'school',
                description: 'School Starts'
            }
        ];
    }

    private setupDailyCommitments() {
        this.dailyCommitments = [
            {
                activity: 'Video Editing (Part-time job)',
                hoursPerDay: 0, // Will be calculated based on available time
                priority: 'high'
            }
        ];
    }

    async ensureDataExists(): Promise<void> {
        const abPath = 'math-ap-calculus-ab.json';
        const bcPath = 'math-ap-calculus-bc.json';

        console.log('🔍 Checking for existing Khan Academy data...');

        // Check if data files exist and are valid
        const abValid = await this.isDataFileValid(abPath);
        const bcValid = await this.isDataFileValid(bcPath);

        if (!abValid || !bcValid) {
            if (!abValid && !bcValid) {
                console.log('📥 No Khan Academy data found. Generating both courses...');
            } else if (!abValid) {
                console.log('📥 AP Calculus AB data missing or invalid. Regenerating...');
            } else {
                console.log('📥 AP Calculus BC data missing or invalid. Regenerating...');
            }
            await this.generateKhanAcademyData();
        } else {
            console.log('✅ Valid Khan Academy data found for both courses.');
        }

        // Load the data
        console.log('📖 Loading Khan Academy data...');
        try {
            if (fs.existsSync(abPath)) {
                const abData = JSON.parse(fs.readFileSync(abPath, 'utf-8')) as FormattedOutputWithSummary;
                this.khanAcademyData['ap-calculus-ab'] = abData;
                console.log(`📚 Loaded AP Calculus AB: ${abData.course.units.length} units, ${abData.summary.course.totalTopics} topics`);
            }
            if (fs.existsSync(bcPath)) {
                const bcData = JSON.parse(fs.readFileSync(bcPath, 'utf-8')) as FormattedOutputWithSummary;
                this.khanAcademyData['ap-calculus-bc'] = bcData;
                console.log(`📚 Loaded AP Calculus BC: ${bcData.course.units.length} units, ${bcData.summary.course.totalTopics} topics`);
            }
        } catch (error) {
            console.error('❌ Error loading Khan Academy data:', error);
            console.log('💡 Tip: Try deleting the JSON files and running again to regenerate them.');
            throw error;
        }
    }

    private async isDataFileValid(filePath: string): Promise<boolean> {
        try {
            if (!fs.existsSync(filePath)) {
                return false;
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Check if the data has the expected structure
            const hasValidStructure = data.course && 
                                    data.course.units && 
                                    Array.isArray(data.course.units) &&
                                    data.summary &&
                                    data.summary.timeEstimate;

            if (!hasValidStructure) {
                console.log(`⚠️  ${filePath} exists but has invalid structure`);
                return false;
            }

            // Check if the file is recent enough (not older than 30 days)
            const stats = fs.statSync(filePath);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            if (stats.mtime < thirtyDaysAgo) {
                console.log(`⚠️  ${filePath} is older than 30 days, may need refreshing`);
                // Don't invalidate, just warn
            }

            return true;
        } catch (error) {
            console.log(`⚠️  ${filePath} exists but is corrupted: ${(error as Error).message}`);
            return false;
        }
    }

    private async generateKhanAcademyData(): Promise<void> {
        const courses = [
            { path: 'math/ap-calculus-ab', filename: 'math-ap-calculus-ab.json' },
            { path: 'math/ap-calculus-bc', filename: 'math-ap-calculus-bc.json' }
        ];

        for (const course of courses) {
            console.log(`🔄 Processing: ${course.path}`);
            try {
                const data = await getContentForPath(course.path, 'US');
                const formattedData = await formatKhanAcademyData(data, course.path, 'US', 50);
                const summary = generateCourseSummary(formattedData);
                
                const dataWithSummary: FormattedOutputWithSummary = {
                    ...formattedData,
                    summary
                };

                saveFormattedData(dataWithSummary, course.filename);
                console.log(`✅ Generated: ${course.filename}`);
            } catch (error) {
                console.error(`❌ Error processing ${course.path}:`, error);
                throw error;
            }
        }
    }

    private calculateRequiredCalcContent(): { totalHours: number; breakdown: any } {
        console.log('🧮 Calculating required AP Calculus content...');
        
        const abData = this.khanAcademyData['ap-calculus-ab'];
        const bcData = this.khanAcademyData['ap-calculus-bc'];
        
        if (!abData || !bcData) {
            throw new Error('Khan Academy data not loaded properly');
        }

        // For AP Calculus AB - we need the last half
        const abUnits = abData.course.units;
        const abHalfPoint = Math.ceil(abUnits.length / 2);
        const abLastHalfUnits = abUnits.slice(abHalfPoint);
        
        // For AP Calculus BC - we need the first half
        const bcUnits = bcData.course.units;
        const bcHalfPoint = Math.ceil(bcUnits.length / 2);
        const bcFirstHalfUnits = bcUnits.slice(0, bcHalfPoint);

        // Calculate total time needed
        const abLastHalfTime = abLastHalfUnits.reduce((sum, unit) => 
            sum + (unit.totalTimeEstimate?.totalMinutes || 0), 0);
        const bcFirstHalfTime = bcFirstHalfUnits.reduce((sum, unit) => 
            sum + (unit.totalTimeEstimate?.totalMinutes || 0), 0);

        const totalMinutes = abLastHalfTime + bcFirstHalfTime;
        const totalHours = totalMinutes / 60;

        const breakdown = {
            apCalculusAB: {
                title: 'AP Calculus AB (Last Half)',
                units: abLastHalfUnits.map(unit => ({
                    title: unit.title,
                    topics: unit.topics.length,
                    estimatedMinutes: unit.totalTimeEstimate?.totalMinutes || 0
                })),
                totalMinutes: abLastHalfTime,
                totalHours: abLastHalfTime / 60
            },
            apCalculusBC: {
                title: 'AP Calculus BC (First Half)',
                units: bcFirstHalfUnits.map(unit => ({
                    title: unit.title,
                    topics: unit.topics.length,
                    estimatedMinutes: unit.totalTimeEstimate?.totalMinutes || 0
                })),
                totalMinutes: bcFirstHalfTime,
                totalHours: bcFirstHalfTime / 60
            }
        };

        return { totalHours, breakdown };
    }

    private getAvailableStudyDays(): { days: Date[], totalDays: number } {
        // Use a fixed date range for demo purposes - from today through September 20th
        const today = new Date();
        const studyDays: Date[] = [];

        // If we're past September 2024, adjust the dates for the current year
        const currentYear = today.getFullYear();
        const adjustedSchoolStart = new Date(`${currentYear}-09-21`);
        const adjustedVacationStart = new Date(`${currentYear}-07-23`);
        const adjustedVacationEnd = new Date(`${currentYear}-08-07`);
        const adjustedCampingStart = new Date(`${currentYear}-09-14`);
        const adjustedCampingEnd = new Date(`${currentYear}-09-17`);

        // If it's already past September, use next year
        const endDate = today < adjustedSchoolStart ? adjustedSchoolStart : new Date(`${currentYear + 1}-09-21`);
        const vacationStart = today < adjustedSchoolStart ? adjustedVacationStart : new Date(`${currentYear + 1}-07-23`);
        const vacationEnd = today < adjustedSchoolStart ? adjustedVacationEnd : new Date(`${currentYear + 1}-08-07`);
        const campingStart = today < adjustedSchoolStart ? adjustedCampingStart : new Date(`${currentYear + 1}-09-14`);
        const campingEnd = today < adjustedSchoolStart ? adjustedCampingEnd : new Date(`${currentYear + 1}-09-17`);

        for (let date = new Date(today); date < endDate; date.setDate(date.getDate() + 1)) {
            let isAvailable = true;
            
            // Check if date falls within vacation period
            if (date >= vacationStart && date <= vacationEnd) {
                isAvailable = false;
            }
            
            // Check if date falls within camping period
            if (date >= campingStart && date <= campingEnd) {
                isAvailable = false;
            }

            if (isAvailable) {
                studyDays.push(new Date(date));
            }
        }

        return { days: studyDays, totalDays: studyDays.length };
    }

    private optimizeSchedule(totalCalcHours: number, availableDays: number): StudyPlan {
        console.log('📅 Creating optimized study schedule...');

        // Assume user wants to balance work and study
        // Let's allocate 6-8 hours per day total (reasonable for summer)
        const totalProductiveHoursPerDay = 8;
        
        // Calculate required calculus hours per day
        const calcHoursPerDay = totalCalcHours / availableDays;
        
        // Remaining time for video editing (ensuring at least 2 hours for video editing as it's their job)
        const minVideoEditingHours = 2;
        const videoEditingHoursPerDay = Math.max(minVideoEditingHours, totalProductiveHoursPerDay - calcHoursPerDay);
        
        // Adjust calculus hours if needed
        const adjustedCalcHoursPerDay = Math.min(calcHoursPerDay, totalProductiveHoursPerDay - minVideoEditingHours);

        // Generate weekly schedule
        const { days: studyDays } = this.getAvailableStudyDays();
        const weeklySchedules = this.generateWeeklySchedules(studyDays, adjustedCalcHoursPerDay, videoEditingHoursPerDay);
        
        // Generate milestones
        const milestones = this.generateMilestones(studyDays, totalCalcHours, adjustedCalcHoursPerDay);

        return {
            totalStudyDays: availableDays,
            calculsStudyHoursPerDay: adjustedCalcHoursPerDay,
            videoEditingHoursPerDay: videoEditingHoursPerDay,
            totalCalcHoursNeeded: totalCalcHours,
            weeklySchedule: weeklySchedules,
            milestones: milestones
        };
    }

    private generateWeeklySchedules(studyDays: Date[], calcHoursPerDay: number, videoEditingHours: number): WeeklySchedule[] {
        const weeks: WeeklySchedule[] = [];
        const startDate = studyDays[0];
        
        // Group days by week
        const currentWeekStart = new Date(startDate);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of week (Sunday)
        
        while (currentWeekStart < studyDays[studyDays.length - 1]) {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const weekDays = studyDays.filter(day => day >= currentWeekStart && day <= weekEnd);
            const availableDays = weekDays.length;
            
            const notes: string[] = [];
            if (availableDays < 7) {
                notes.push(`Only ${availableDays} study days this week due to constraints`);
            }
            
            weeks.push({
                weekStart: new Date(currentWeekStart),
                weekEnd: new Date(weekEnd),
                availableDays,
                calcHoursPerDay,
                videoEditingHours,
                totalWeeklyCalcHours: calcHoursPerDay * availableDays,
                notes
            });
            
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }
        
        return weeks;
    }

    private generateMilestones(studyDays: Date[], totalHours: number, hoursPerDay: number): Milestone[] {
        const milestones: Milestone[] = [];
        const milestonePercentages = [25, 50, 75, 100];
        
        if (studyDays.length === 0) {
            // No study days available, create placeholder milestones
            console.log('⚠️  No study days available for milestones');
            return [];
        }
        
        for (const percentage of milestonePercentages) {
            const hoursNeeded = (totalHours * percentage) / 100;
            const daysNeeded = Math.ceil(hoursNeeded / hoursPerDay);
            const dayIndex = Math.min(daysNeeded - 1, studyDays.length - 1);
            const milestoneDate = studyDays[dayIndex];
            
            if (milestoneDate) {
                milestones.push({
                    date: milestoneDate,
                    description: `${percentage}% Complete - AP Calculus`,
                    hoursCompleted: hoursNeeded,
                    percentComplete: percentage
                });
            }
        }
        
        return milestones;
    }

    async generatePlan(): Promise<StudyPlan> {
        console.log('🚀 Generating Advanced Summer Planner for AP Calculus...\n');

        // Ensure data exists
        await this.ensureDataExists();

        // Calculate required content
        const { totalHours, breakdown } = this.calculateRequiredCalcContent();
        
        // Get available study days
        const { totalDays } = this.getAvailableStudyDays();
        
        // Generate optimized schedule
        const studyPlan = this.optimizeSchedule(totalHours, totalDays);

        // Display summary
        this.displayPlanSummary(studyPlan, breakdown);

        return studyPlan;
    }

    private displayPlanSummary(plan: StudyPlan, breakdown: any) {
        console.log('📊 SUMMER STUDY PLAN SUMMARY');
        console.log('═══════════════════════════════════════════════════════');
        
        console.log('\n📚 CURRICULUM BREAKDOWN:');
        console.log(`${breakdown.apCalculusAB.title}: ${breakdown.apCalculusAB.totalHours.toFixed(1)} hours`);
        console.log(`${breakdown.apCalculusBC.title}: ${breakdown.apCalculusBC.totalHours.toFixed(1)} hours`);
        console.log(`Total Calculus Study Time Needed: ${plan.totalCalcHoursNeeded.toFixed(1)} hours`);
        
        console.log('\n⏰ DAILY SCHEDULE:');
        console.log(`📖 AP Calculus Study: ${plan.calculsStudyHoursPerDay.toFixed(1)} hours/day`);
        console.log(`🎬 Video Editing Work: ${plan.videoEditingHoursPerDay.toFixed(1)} hours/day`);
        console.log(`📅 Total Study Days Available: ${plan.totalStudyDays} days`);
        
        console.log('\n🎯 MILESTONES:');
        plan.milestones.forEach(milestone => {
            console.log(`${milestone.date.toLocaleDateString()}: ${milestone.description} (${milestone.hoursCompleted.toFixed(1)}h)`);
        });
        
        console.log('\n📅 WEEKLY BREAKDOWN:');
        plan.weeklySchedule.slice(0, 4).forEach((week, index) => {
            console.log(`Week ${index + 1} (${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()}):`);
            console.log(`  • ${week.availableDays} study days`);
            console.log(`  • ${week.totalWeeklyCalcHours.toFixed(1)} total calculus hours`);
            if (week.notes.length > 0) {
                console.log(`  • ${week.notes.join(', ')}`);
            }
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('• Study calculus in focused 2-3 hour blocks with breaks');
        console.log('• Schedule video editing during your most creative hours');
        console.log('• Review previous topics weekly to reinforce learning');
        console.log('• Adjust schedule if you finish topics faster/slower than estimated');
        console.log('• Take one full rest day per week to prevent burnout');
    }
}

// Export the main function
export const createAdvancedSummerPlan = async (): Promise<StudyPlan> => {
    const planner = new AdvancedSummerPlanner();
    return await planner.generatePlan();
};

// If run directly
if (import.meta.main) {
    createAdvancedSummerPlan().catch(console.error);
}
