import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import { StudyPlan, WeeklySchedule, Milestone, DailyTimeBlock, UnitPlan } from './index.js';

export class StudyPlanPDFGenerator {
    private doc: PDFKit.PDFDocument;
    private pageWidth: number;
    private pageHeight: number;
    private margin: number;
    private currentY: number;

    constructor() {
        this.doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: 'Advanced Calculus 2 Summer Study Plan',
                Author: 'AP Calculus Planner',
                Subject: 'Summer Study Schedule',
                Keywords: 'calculus, study plan, schedule'
            }
        });
        
        this.pageWidth = this.doc.page.width;
        this.pageHeight = this.doc.page.height;
        this.margin = 50;
        this.currentY = this.margin;
    }

    async generatePDF(studyPlan: StudyPlan, filename: string = 'calculus-2-study-plan.pdf'): Promise<string> {
        console.log('📄 Generating PDF study plan...');

        // Create write stream
        const stream = fs.createWriteStream(filename);
        this.doc.pipe(stream);

        // Generate PDF content
        this.addHeader();
        this.addOverview(studyPlan);
        this.addDailySchedule(studyPlan.dailySchedule);
        this.addCurriculumFocus(studyPlan.unitPlanning);
        this.addWeeklyGoals(studyPlan.weeklySchedule);
        this.addMilestones(studyPlan.milestones);
        this.addSuccessStrategies();
        this.addFooter();

        // Finalize the PDF
        this.doc.end();

        // Wait for the stream to finish
        await new Promise<void>((resolve, reject) => {
            stream.on('finish', () => resolve());
            stream.on('error', reject);
        });

        console.log(`✅ PDF generated successfully: ${filename}`);
        return filename;
    }

    private addHeader(): void {
        // Title
        this.doc.fontSize(24)
            .fillColor('#2563eb')
            .font('Helvetica-Bold')
            .text('Advanced Calculus 2 Summer Study Plan', this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: 'center'
            });

        this.currentY += 40;

        // Subtitle
        this.doc.fontSize(14)
            .fillColor('#64748b')
            .font('Helvetica')
            .text('A Comprehensive Guide to Mastering Calculus 2 Topics', this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: 'center'
            });

        this.currentY += 30;

        // Date
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        this.doc.fontSize(12)
            .fillColor('#6b7280')
            .text(`Generated on ${today}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: 'center'
            });

        this.currentY += 40;
        this.addHorizontalLine();
    }

    private addOverview(studyPlan: StudyPlan): void {
        this.addSectionTitle('Study Plan Overview');
        
        const totalHours = studyPlan.totalCalcHoursNeeded;
        const dailyHours = studyPlan.calcStudyHoursPerDay;
        const videoEditingHours = studyPlan.videoEditingHoursPerDay;
        
        this.doc.fontSize(12)
            .fillColor('#374151')
            .font('Helvetica');

        const overviewData = [
            `• Total Calculus 2 Study Time: ${totalHours} hours`,
            `• Daily Calculus Study: ${dailyHours} hours/day`,
            `• Daily Video Editing: ${videoEditingHours} hours/day`,
            `• Available Study Days: ${studyPlan.totalStudyDays} days`,
            `• Study Period: Through September 2024`
        ];

        overviewData.forEach(item => {
            this.doc.text(item, this.margin, this.currentY);
            this.currentY += 20;
        });

        this.currentY += 20;
    }

    private addDailySchedule(schedule: DailyTimeBlock[]): void {
        this.addSectionTitle('Daily Schedule Template');
        
        this.doc.fontSize(11)
            .fillColor('#374151')
            .font('Helvetica');

        // Table headers
        const colWidths = [120, 150, 200];
        const tableX = this.margin;
        let tableY = this.currentY;

        // Header background
        this.doc.fillColor('#f3f4f6')
            .rect(tableX, tableY, colWidths.reduce((a, b) => a + b, 0), 25)
            .fill();

        // Header text
        this.doc.fillColor('#1f2937')
            .font('Helvetica-Bold')
            .text('Time Slot', tableX + 5, tableY + 8)
            .text('Activity', tableX + colWidths[0] + 5, tableY + 8)
            .text('Description', tableX + colWidths[0] + colWidths[1] + 5, tableY + 8);

        tableY += 25;

        // Table rows
        schedule.forEach((block, index) => {
            const rowColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            
            // Row background
            this.doc.fillColor(rowColor)
                .rect(tableX, tableY, colWidths.reduce((a, b) => a + b, 0), 25)
                .fill();

            // Row text
            this.doc.fillColor('#374151')
                .font('Helvetica')
                .text(block.timeSlot, tableX + 5, tableY + 8, { width: colWidths[0] - 10 })
                .text(block.activity, tableX + colWidths[0] + 5, tableY + 8, { width: colWidths[1] - 10 })
                .text(block.description, tableX + colWidths[0] + colWidths[1] + 5, tableY + 8, { 
                    width: colWidths[2] - 10,
                    height: 20
                });

            tableY += 25;
        });

        this.currentY = tableY + 20;
    }

    private addCurriculumFocus(units: UnitPlan[]): void {
        this.addSectionTitle('Calculus 2 Curriculum Focus');
        
        this.doc.fontSize(12)
            .fillColor('#374151')
            .font('Helvetica');

        units.forEach((unit, index) => {
            // Check if we need space for the entire unit block (about 80 points)
            this.checkPageBreak(80);
            
            // Unit title
            this.doc.fillColor('#2563eb')
                .font('Helvetica-Bold')
                .text(`${index + 1}. ${unit.unitTitle}`, this.margin, this.currentY);
            
            this.currentY += 18;

            // Unit details - keep them together
            this.doc.fillColor('#6b7280')
                .font('Helvetica')
                .text(`   • Estimated Time: ${unit.estimatedHours} hours`, this.margin, this.currentY);
            this.currentY += 15;
            
            this.doc.text(`   • Topics: ${unit.topics.length} topics`, this.margin, this.currentY);
            this.currentY += 15;
            
            this.doc.text(`   • Target Week: ${unit.weekTarget}`, this.margin, this.currentY);
            this.currentY += 20;
        });

        this.currentY += 10;
    }

    private addWeeklyGoals(weeks: WeeklySchedule[]): void {
        this.checkPageBreak(200);
        this.addSectionTitle('Weekly Goals & Targets');
        
        weeks.slice(0, 6).forEach((week, index) => {
            // Calculate space needed based on content
            const baseSpace = 100;
            const noteSpace = week.notes.length > 0 ? 25 : 0;
            const totalSpace = baseSpace + noteSpace;
            
            this.checkPageBreak(totalSpace);
            
            // Week header
            this.doc.fillColor('#1e40af')
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`Week ${index + 1} (${week.weekStart.toLocaleDateString()} - ${week.weekEnd.toLocaleDateString()})`, 
                    this.margin, this.currentY);
            
            this.currentY += 20;

            // Week details
            this.doc.fillColor('#374151')
                .font('Helvetica')
                .fontSize(11);

            const details = [
                `Goal: ${week.weeklyGoal}`,
                `Unit: ${week.targetUnit}`,
                `Study Hours: ${week.totalWeeklyCalcHours}h (${week.availableDays} days x 3h/day)`,
                `Topics: ${week.topicsToComplete.slice(0, 2).join(', ')}${week.topicsToComplete.length > 2 ? '...' : ''}`
            ];

            details.forEach(detail => {
                this.doc.text(`   • ${detail}`, this.margin, this.currentY, {
                    width: this.pageWidth - 2 * this.margin
                });
                this.currentY += 15;
            });

            if (week.notes.length > 0) {
                this.doc.fillColor('#dc2626')
                    .text(`   Note: ${week.notes.join(', ')}`, this.margin, this.currentY, {
                        width: this.pageWidth - 2 * this.margin
                    });
                this.currentY += 20;
            }

            this.currentY += 20;
        });
    }

    private addMilestones(milestones: Milestone[]): void {
        this.checkPageBreak(200);
        this.addSectionTitle('Major Milestones');
        
        this.doc.fontSize(11)
            .fillColor('#374151')
            .font('Helvetica');

        milestones.forEach(milestone => {
            // Check for space for each milestone block
            this.checkPageBreak(50);
            
            this.doc.fillColor('#059669')
                .font('Helvetica-Bold')
                .text(`${milestone.date.toLocaleDateString()}: ${milestone.description}`, this.margin, this.currentY);
            
            this.currentY += 18;

            this.doc.fillColor('#6b7280')
                .font('Helvetica')
                .text(`   Progress: ${milestone.percentComplete}% (${milestone.hoursCompleted.toFixed(1)}h total)`, 
                    this.margin, this.currentY);

            this.currentY += 25;
        });

        this.currentY += 10;
    }

    private addSuccessStrategies(): void {
        this.checkPageBreak(250);
        this.addSectionTitle('Success Strategies');
        
        const strategies = [
            'Morning session (10-11am): Watch Khan Academy videos & take notes',
            'Afternoon session (2-4pm): Practice problems & work through exercises',
            'Take detailed notes and create summary sheets for each topic',
            'Review previous topics for 15 minutes each week',
            'Use Khan Academy mobile app during breaks for quick reviews',
            'Focus on understanding concepts, not just memorizing formulas',
            'Track your progress and adjust timeline if needed'
        ];

        this.doc.fontSize(11)
            .fillColor('#374151')
            .font('Helvetica');

        strategies.forEach(strategy => {
            this.doc.text(`• ${strategy}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin
            });
            this.currentY += 18;
        });

        this.currentY += 20;

        // Priority focus areas
        this.addSubsectionTitle('Priority Focus Areas');
        
        const priorities = [
            'Integration techniques and applications (highest priority)',
            'Sequences and series convergence tests',
            'Parametric equations and polar coordinate systems',
            'Real-world applications of calculus concepts'
        ];

        priorities.forEach(priority => {
            this.doc.text(`• ${priority}`, this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin
            });
            this.currentY += 18;
        });
    }

    private addFooter(): void {
        // Add some space before footer, but don't force a new page
        this.currentY += 30;
        
        // Only add footer if we have reasonable space, otherwise skip it
        if (this.currentY < this.pageHeight - 80) {
            this.doc.fontSize(10)
                .fillColor('#9ca3af')
                .font('Helvetica')
                .text('Generated by Advanced AP Calculus Planner', this.margin, this.currentY, {
                    width: this.pageWidth - 2 * this.margin,
                    align: 'center'
                });
                
            this.currentY += 15;
            
            this.doc.text('Remember: Consistency and understanding are key to success!', this.margin, this.currentY, {
                width: this.pageWidth - 2 * this.margin,
                align: 'center'
            });
        }
    }

    private addSectionTitle(title: string): void {
        this.checkPageBreak(80);
        
        this.doc.fontSize(16)
            .fillColor('#1e40af')
            .font('Helvetica-Bold')
            .text(title, this.margin, this.currentY);
        
        this.currentY += 30;
    }

    private addSubsectionTitle(title: string): void {
        this.doc.fontSize(13)
            .fillColor('#2563eb')
            .font('Helvetica-Bold')
            .text(title, this.margin, this.currentY);
        
        this.currentY += 25;
    }

    private addHorizontalLine(): void {
        this.doc.strokeColor('#e5e7eb')
            .lineWidth(1)
            .moveTo(this.margin, this.currentY)
            .lineTo(this.pageWidth - this.margin, this.currentY)
            .stroke();
        
        this.currentY += 20;
    }

    private checkPageBreak(neededSpace: number): void {
        // More conservative page break - leave more space at bottom
        if (this.currentY + neededSpace > this.pageHeight - 120) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }
}

export const generateStudyPlanPDF = async (studyPlan: StudyPlan, filename?: string): Promise<string> => {
    const generator = new StudyPlanPDFGenerator();
    return await generator.generatePDF(studyPlan, filename);
}; 