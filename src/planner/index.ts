import * as fs from 'fs';
import { FormattedOutputWithSummary } from '../khanacademy/impl/types.js';
import { getContentForPath, formatKhanAcademyData, saveFormattedData, generateCourseSummary } from '../khanacademy/index.js';

// Types for the planner
export interface DateConstraint {
    start: Date;
    end: Date;
    type: 'vacation' | 'camping' | 'school';
    description: string;
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
                end: new Date('2024-12-31'),
                type: 'school',
                description: 'School Starts'
            }
        ];
    }

    async ensureDataExists(): Promise<void> {
        const abPath = 'math-ap-calculus-ab.json';
        const bcPath = 'math-ap-calculus-bc.json';

        console.log('🔍 Checking for existing Khan Academy data...');

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
            
            const hasValidStructure = data.course && 
                                    data.course.units && 
                                    Array.isArray(data.course.units) &&
                                    data.summary &&
                                    data.summary.timeEstimate;

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

    private identifyCalc2Topics(): UnitPlan[] {
        console.log('🔍 Identifying Calculus 2 specific topics...');
        
        const bcData = this.khanAcademyData['ap-calculus-bc'];
        if (!bcData) {
            throw new Error('Khan Academy BC data not loaded properly');
        }

        // Calculus 2 typically covers these units from AP Calc BC:
        const calc2Units = [
            { unitIndex: 5, isCalc2: true, priority: 1 }, // Integration and accumulation of change
            { unitIndex: 7, isCalc2: true, priority: 2 }, // Applications of integration  
            { unitIndex: 8, isCalc2: true, priority: 3 }, // Parametric equations, polar coordinates, and vector-valued functions
            { unitIndex: 9, isCalc2: true, priority: 4 }, // Infinite sequences and series
        ];

        const unitPlans: UnitPlan[] = [];

        calc2Units.forEach(({ unitIndex, isCalc2, priority }) => {
            const unit = bcData.course.units[unitIndex];
            if (unit) {
                const topics = unit.topics.map(topic => topic.title);
                const estimatedHours = Math.max(
                    (unit.totalTimeEstimate?.totalMinutes || 0) / 60,
                    topics.length * 2 // Minimum 2 hours per topic for thorough understanding
                );

                unitPlans.push({
                    unitNumber: unitIndex + 1,
                    unitTitle: unit.title,
                    topics: topics,
                    estimatedHours: Math.round(estimatedHours * 10) / 10,
                    weekTarget: priority,
                    isCalc2Topic: isCalc2
                });
            }
        });

        return unitPlans;
    }

    private getAvailableStudyDays(): { days: Date[], totalDays: number } {
        const today = new Date();
        const studyDays: Date[] = [];

        const currentYear = today.getFullYear();
        const adjustedSchoolStart = new Date(`${currentYear}-09-21`);
        const adjustedVacationStart = new Date(`${currentYear}-07-23`);
        const adjustedVacationEnd = new Date(`${currentYear}-08-07`);
        const adjustedCampingStart = new Date(`${currentYear}-09-14`);
        const adjustedCampingEnd = new Date(`${currentYear}-09-17`);

        const endDate = today < adjustedSchoolStart ? adjustedSchoolStart : new Date(`${currentYear + 1}-09-21`);
        const vacationStart = today < adjustedSchoolStart ? adjustedVacationStart : new Date(`${currentYear + 1}-07-23`);
        const vacationEnd = today < adjustedSchoolStart ? adjustedVacationEnd : new Date(`${currentYear + 1}-08-07`);
        const campingStart = today < adjustedSchoolStart ? adjustedCampingStart : new Date(`${currentYear + 1}-09-14`);
        const campingEnd = today < adjustedSchoolStart ? adjustedCampingEnd : new Date(`${currentYear + 1}-09-17`);

        for (let date = new Date(today); date < endDate; date.setDate(date.getDate() + 1)) {
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
                description: "Focus on current unit topics with Khan Academy videos and practice"
            },
            {
                timeSlot: "11:00 - 11:30 AM", 
                activity: "Light Workout/Break",
                duration: "30 minutes",
                description: "Physical activity to refresh mind and body"
            },
            {
                timeSlot: "11:30 AM - 12:30 PM",
                activity: "Video Editing Work",
                duration: "1 hour", 
                description: "Part-time job responsibilities"
            },
            {
                timeSlot: "12:30 - 2:00 PM",
                activity: "Lunch & Break",
                duration: "1.5 hours",
                description: "Meal time and personal break"
            },
            {
                timeSlot: "2:00 - 4:00 PM",
                activity: "Deep Calculus 2 Study",
                duration: "2 hours",
                description: "Problem solving, practice exercises, and concept reinforcement"
            },
            {
                timeSlot: "4:00 - 5:00 PM",
                activity: "Video Editing Work",
                duration: "1 hour",
                description: "Continue part-time job work"
            },
            {
                timeSlot: "Evening",
                activity: "Free Time/Review",
                duration: "Flexible",
                description: "Optional review or personal time"
            }
        ];
    }

    private optimizeSchedule(unitPlans: UnitPlan[], availableDays: number): StudyPlan {
        console.log('📅 Creating optimized Calculus 2 study schedule...');

        const totalCalcHours = unitPlans.reduce((sum, unit) => sum + unit.estimatedHours, 0);
        const calcHoursPerDay = 3; // 1 hour morning + 2 hours afternoon
        const videoEditingHoursPerDay = 2; // 1 hour + 1 hour as shown in schedule
        
        const { days: studyDays } = this.getAvailableStudyDays();
        const weeklySchedules = this.generateWeeklySchedules(studyDays, unitPlans);
        const milestones = this.generateDetailedMilestones(studyDays, unitPlans, calcHoursPerDay);
        const dailySchedule = this.createDailySchedule();

        return {
            totalStudyDays: availableDays,
            calcStudyHoursPerDay: calcHoursPerDay,
            videoEditingHoursPerDay: videoEditingHoursPerDay,
            totalCalcHoursNeeded: totalCalcHours,
            weeklySchedule: weeklySchedules,
            milestones: milestones,
            dailySchedule: dailySchedule,
            unitPlanning: unitPlans
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
            
            const weekDays = studyDays.filter(day => day >= currentWeekStart && day <= weekEnd);
            const availableDays = weekDays.length;
            
            const currentUnit = unitPlans[unitIndex];
            const weeklyHours = availableDays * calcHoursPerDay;
            
            const notes: string[] = [];
            if (availableDays < 7) {
                notes.push(`Only ${availableDays} study days this week due to constraints`);
            }
            
            // Determine topics to complete this week
            const hoursPerTopic = currentUnit.estimatedHours / currentUnit.topics.length;
            const topicsThisWeek = Math.min(
                Math.floor(weeklyHours / hoursPerTopic),
                currentUnit.topics.length
            );
            
            weeks.push({
                weekStart: new Date(currentWeekStart),
                weekEnd: new Date(weekEnd),
                availableDays,
                targetUnit: `Unit ${currentUnit.unitNumber}: ${currentUnit.unitTitle}`,
                topicsToComplete: currentUnit.topics.slice(0, topicsThisWeek),
                totalWeeklyCalcHours: weeklyHours,
                weeklyGoal: `Complete ${topicsThisWeek} topics from ${currentUnit.unitTitle}`,
                notes
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
            console.log('⚠️  No study days available for milestones');
            return [];
        }
        
        let cumulativeHours = 0;
        let dayIndex = 0;
        
        unitPlans.forEach((unit, index) => {
            const daysNeeded = Math.ceil(unit.estimatedHours / hoursPerDay);
            dayIndex = Math.min(dayIndex + daysNeeded, studyDays.length - 1);
            cumulativeHours += unit.estimatedHours;
            
            const completedUnits = unitPlans.slice(0, index + 1).map(u => u.unitTitle);
            const totalHours = unitPlans.reduce((sum, u) => sum + u.estimatedHours, 0);
            const percentComplete = Math.round((cumulativeHours / totalHours) * 100);
            
            if (studyDays[dayIndex]) {
                milestones.push({
                    date: studyDays[dayIndex],
                    description: `Complete ${unit.unitTitle}`,
                    hoursCompleted: cumulativeHours,
                    percentComplete: percentComplete,
                    unitsCompleted: completedUnits
                });
            }
        });
        
        return milestones;
    }

    async generatePlan(): Promise<StudyPlan> {
        console.log('🚀 Generating Advanced Calculus 2 Summer Planner...\n');

        await this.ensureDataExists();
        const unitPlans = this.identifyCalc2Topics();
        const { totalDays } = this.getAvailableStudyDays();
        const studyPlan = this.optimizeSchedule(unitPlans, totalDays);

        this.displayDetailedPlan(studyPlan);
        return studyPlan;
    }

    private displayDetailedPlan(plan: StudyPlan) {
        console.log('📊 DETAILED CALCULUS 2 SUMMER STUDY PLAN');
        console.log('═══════════════════════════════════════════════════════');
        
        console.log('\n🎯 CALCULUS 2 CURRICULUM FOCUS:');
        plan.unitPlanning.forEach((unit, index) => {
            console.log(`${index + 1}. ${unit.unitTitle}`);
            console.log(`   ⏱️  Estimated Time: ${unit.estimatedHours} hours`);
            console.log(`   📚 Topics: ${unit.topics.length} topics`);
            console.log(`   🎯 Target Week: ${unit.weekTarget}`);
        });
        
        const totalHours = plan.unitPlanning.reduce((sum, unit) => sum + unit.estimatedHours, 0);
        console.log(`\n📊 TOTAL CALCULUS 2 STUDY TIME: ${totalHours} hours`);
        console.log(`📅 AVAILABLE STUDY DAYS: ${plan.totalStudyDays} days`);
        
        console.log('\n⏰ DAILY SCHEDULE TEMPLATE:');
        plan.dailySchedule.forEach(block => {
            console.log(`${block.timeSlot.padEnd(20)} | ${block.activity.padEnd(25)} | ${block.description}`);
        });
        
        console.log('\n📅 WEEKLY GOALS & TARGETS:');
        plan.weeklySchedule.slice(0, 6).forEach((week, index) => {
            console.log(`\n📆 Week ${index + 1} (${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()})`);
            console.log(`   🎯 Goal: ${week.weeklyGoal}`);
            console.log(`   📚 Unit: ${week.targetUnit}`);
            console.log(`   ⏱️  Study Hours: ${week.totalWeeklyCalcHours}h (${week.availableDays} days × 3h/day)`);
            console.log(`   📋 Topics to Complete: ${week.topicsToComplete.slice(0, 3).join(', ')}${week.topicsToComplete.length > 3 ? '...' : ''}`);
            if (week.notes.length > 0) {
                console.log(`   ⚠️  Notes: ${week.notes.join(', ')}`);
            }
        });
        
        console.log('\n🎯 MAJOR MILESTONES:');
        plan.milestones.forEach(milestone => {
            console.log(`📅 ${milestone.date.toLocaleDateString()}: ${milestone.description}`);
            console.log(`   ✅ Progress: ${milestone.percentComplete}% (${milestone.hoursCompleted.toFixed(1)}h total)`);
        });
        
        console.log('\n💡 SUCCESS STRATEGIES:');
        console.log('• 📖 Morning session (10-11am): Watch Khan Academy videos & take notes');
        console.log('• 🧠 Afternoon session (2-4pm): Practice problems & work through exercises');
        console.log('• 📝 Take detailed notes and create summary sheets for each topic');
        console.log('• 🔄 Review previous topics for 15 minutes each week');
        console.log('• 📱 Use Khan Academy mobile app during breaks for quick reviews');
        console.log('• 🎯 Focus on understanding concepts, not just memorizing formulas');
        console.log('• 📊 Track your progress and adjust timeline if needed');
        
        console.log('\n⚡ PRIORITY FOCUS AREAS:');
        console.log('• Integration techniques and applications (highest priority)');
        console.log('• Sequences and series convergence tests');  
        console.log('• Parametric equations and polar coordinate systems');
        console.log('• Real-world applications of calculus concepts');
    }
}

export const createAdvancedSummerPlan = async (): Promise<StudyPlan> => {
    const planner = new AdvancedSummerPlanner();
    return await planner.generatePlan();
};

if (import.meta.main) {
    createAdvancedSummerPlan().catch(console.error);
}
