#!/usr/bin/env node

import { Command } from "commander";
import { createAdvancedSummerPlan } from "./planner/index.js";
import { generateStudyPlanPDF } from "./planner/pdfGenerator.js";
import { generateExcelSpreadsheet } from "./planner/excelGenerator.js";
import { getContentForPath, formatKhanAcademyData, saveFormattedData, generateCourseSummary } from "./khanacademy/index.js";
import * as fs from "fs";

const program = new Command();

// Define the main CLI structure
program.name("calculus-planner").description("Advanced Summer Planner for Calculus Studies").version("2.0.0");

// Command to generate Khan Academy data
program
    .command("generate-data")
    .description("Generate Khan Academy course data for Calculus 2")
    .option("-f, --force", "Force regenerate data even if files exist")
    .option("-v, --verbose", "Enable verbose output")
    .action(async (options) => {
        try {
            console.log("🔄 Generating Khan Academy Data...\n");

            const courses = [{ path: "math/calculus-2", filename: "math-calculus-2.json" }];

            for (const course of courses) {
                const filePath = course.filename;
                const fileExists = fs.existsSync(filePath);

                if (fileExists && !options.force) {
                    console.log(`✅ ${course.filename} already exists (use --force to regenerate)`);
                    continue;
                }

                if (fileExists && options.force) {
                    console.log(`🔄 Force regenerating ${course.filename}...`);
                }

                console.log(`📥 Processing: ${course.path}`);
                const data = await getContentForPath(course.path, "US");
                const formattedData = await formatKhanAcademyData(data, course.path, "US", 50);
                const summary = generateCourseSummary(formattedData);

                const dataWithSummary = {
                    ...formattedData,
                    summary,
                };

                saveFormattedData(dataWithSummary, course.filename);
                console.log(`✅ Generated: ${course.filename}`);

                if (options.verbose) {
                    console.log(`   📊 Units: ${dataWithSummary.course.units.length}`);
                    console.log(`   📚 Total Content: ${dataWithSummary.summary.content.videos.total + dataWithSummary.summary.content.exercises} items`);
                    console.log(`   ⏱️  Estimated Time: ${dataWithSummary.summary.timeEstimate.totalFormatted}`);
                }
            }

            console.log("\n🎉 All Khan Academy data generated successfully!");
        } catch (error) {
            console.error("❌ Error generating data:", error);
            process.exit(1);
        }
    });

// Command to check existing data
program
    .command("check-data")
    .description("Check status of existing Khan Academy data files")
    .action(() => {
        console.log("📋 Checking Khan Academy Data Files...\n");

        const files = ["math-calculus-2.json"];

        let allFilesExist = true;

        for (const filename of files) {
            const exists = fs.existsSync(filename);
            const status = exists ? "✅ EXISTS" : "❌ MISSING";

            if (exists) {
                try {
                    const stats = fs.statSync(filename);
                    const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
                    const size = (stats.size / 1024).toFixed(1);
                    const modified = stats.mtime.toLocaleDateString();

                    console.log(`${status} - ${filename}`);
                    console.log(`   📁 Size: ${size} KB`);
                    console.log(`   📅 Modified: ${modified}`);
                    console.log(`   📚 Course: ${data.course?.title || "Unknown"}`);
                    console.log(`   📊 Units: ${data.course?.units?.length || 0}`);
                    console.log("");
                } catch {
                    console.log(`${status} - ${filename} (corrupted file)`);
                    allFilesExist = false;
                }
            } else {
                console.log(`${status} - ${filename}`);
                allFilesExist = false;
            }
        }

        if (allFilesExist) {
            console.log("🎉 All required data files are present and valid!");
        } else {
            console.log('⚠️  Some data files are missing. Run "generate-data" to create them.');
        }
    });

// Main command to create study plan
program
    .command("plan", { isDefault: true })
    .description("Generate your personalized summer study plan")
    .option("-v, --verbose", "Enable verbose output with detailed breakdown")
    .option("--vacation-start <date>", "Vacation start date (YYYY-MM-DD)", "2024-07-23")
    .option("--vacation-end <date>", "Vacation end date (YYYY-MM-DD)", "2024-08-07")
    .option("--camping-start <date>", "Camping start date (YYYY-MM-DD)", "2024-09-14")
    .option("--camping-end <date>", "Camping end date (YYYY-MM-DD)", "2024-09-17")
    .option("--school-start <date>", "School start date (YYYY-MM-DD)", "2024-09-21")
    .option("--video-editing-hours <hours>", "Daily video editing hours", "2")
    .option("--max-study-hours <hours>", "Maximum daily study hours", "8")
    .action(async (options) => {
        try {
            console.log("🌟 Welcome to the Advanced Summer Planner for Calculus 2! 🌟\n");

            if (options.verbose) {
                console.log("📅 Schedule Configuration:");
                console.log(`   🏖️  Vacation: ${options.vacationStart} to ${options.vacationEnd}`);
                console.log(`   🏕️  Camping: ${options.campingStart} to ${options.campingEnd}`);
                console.log(`   🏫 School Starts: ${options.schoolStart}`);
                console.log(`   🎬 Video Editing: ${options.videoEditingHours} hours/day`);
                console.log(`   📚 Max Study Time: ${options.maxStudyHours} hours/day\n`);
            }

            await createAdvancedSummerPlan();

            console.log("\n✅ Your personalized summer study plan has been generated!");
            console.log("💡 Remember to adjust the schedule based on your actual progress and preferences.");
            console.log("🎯 Good luck with your Calculus 2 studies this summer!");

            if (options.verbose) {
                console.log("\n📝 Next Steps:");
                console.log("   1. Start with the first topic from Calculus 2");
                console.log("   2. Set up a daily routine with your video editing work");
                console.log("   3. Track your progress against the milestones");
                console.log("   4. Adjust your pace as needed");
            }
        } catch (error) {
            console.error("❌ Error generating study plan:", error);
            console.log('\n💡 Try running "check-data" to verify your data files are valid.');
            process.exit(1);
        }
    });

// Command to generate PDF
program
    .command("pdf")
    .description("Generate a PDF version of your study plan")
    .option("-o, --output <filename>", "Output filename", "calculus-2-study-plan.pdf")
    .option("--vacation-start <date>", "Vacation start date (YYYY-MM-DD)", "2024-07-23")
    .option("--vacation-end <date>", "Vacation end date (YYYY-MM-DD)", "2024-08-07")
    .option("--camping-start <date>", "Camping start date (YYYY-MM-DD)", "2024-09-14")
    .option("--camping-end <date>", "Camping end date (YYYY-MM-DD)", "2024-09-17")
    .option("--school-start <date>", "School start date (YYYY-MM-DD)", "2024-09-21")
    .action(async (options) => {
        try {
            console.log("📄 Generating PDF study plan...\n");

            const studyPlan = await createAdvancedSummerPlan();
            const filename = await generateStudyPlanPDF(studyPlan, options.output);

            console.log("\n🎉 PDF study plan generated successfully!");
            console.log(`📎 File: ${filename}`);
            console.log("💌 Ready to send to your mom!");
        } catch (error) {
            console.error("❌ Error generating PDF:", error);
            console.log('\n💡 Try running "check-data" to verify your data files are valid.');
            process.exit(1);
        }
    });

// Command to show detailed curriculum info
program
    .command("curriculum")
    .description("Show detailed curriculum breakdown for Calculus 2")
    .option("--course <course>", "Show specific course (2|both)", "2")
    .action((options) => {
        console.log("📚 Calculus 2 Curriculum Overview\n");

        const courses = [];
        if (options.course === "2" || options.course === "both") {
            courses.push("math-calculus-2.json");
        }

        for (const filename of courses) {
            if (!fs.existsSync(filename)) {
                console.log(`❌ ${filename} not found. Run "generate-data" first.`);
                continue;
            }

            try {
                const data = JSON.parse(fs.readFileSync(filename, "utf-8"));
                const course = data.course;
                const summary = data.summary;

                console.log(`🎓 ${course.title}`);
                console.log(`📖 ${course.description}`);
                console.log(`⏱️  Total Time: ${summary.timeEstimate.totalFormatted}`);
                console.log(`📊 Structure: ${course.units.length} units, ${summary.course.totalTopics} topics, ${summary.course.totalContentItems} items`);
                console.log();

                console.log("📂 Units:");
                course.units.forEach((unit: any, index: number) => {
                    const unitSummary = summary.breakdown.unitSummaries[index];
                    console.log(`   ${index + 1}. ${unit.title}`);
                    console.log(`      📋 ${unitSummary.topicCount} topics, ${unitSummary.contentCount} items`);
                    console.log(`      ⏱️  ~${Math.round((unitSummary.estimatedMinutes / 60) * 10) / 10} hours`);
                });
                console.log();
            } catch (error) {
                console.log(`❌ Error reading ${filename}: ${(error as Error).message}`);
            }
        }
    });

// Command to generate Excel table
program
    .command("excel")
    .description("Generate professionally formatted Excel spreadsheet with daily breakdown")
    .option("-o, --output <filename>", "Output Excel filename", "calculus-2-daily-schedule.xlsx")
    .option("--vacation-start <date>", "Vacation start date (YYYY-MM-DD)", "2024-07-23")
    .option("--vacation-end <date>", "Vacation end date (YYYY-MM-DD)", "2024-08-07")
    .option("--camping-start <date>", "Camping start date (YYYY-MM-DD)", "2024-09-14")
    .option("--camping-end <date>", "Camping end date (YYYY-MM-DD)", "2024-09-17")
    .option("--school-start <date>", "School start date (YYYY-MM-DD)", "2024-09-21")
    .action(async (options) => {
        try {
            console.log("📊 Generating professional Excel spreadsheet...\n");

            const studyPlan = await createAdvancedSummerPlan();
            const filename = await generateExcelSpreadsheet(studyPlan, options.output);

            console.log(`\n🎉 Excel spreadsheet generated successfully!`);
            console.log(`📎 File: ${filename}`);
            console.log(`📊 Total study days: ${studyPlan.dailyBreakdown.length}`);
            console.log(`⏱️  Total study hours: ${studyPlan.dailyBreakdown.reduce((sum, day) => sum + day.studyHours, 0)} hours`);
            console.log(`📈 Study period: ${studyPlan.dailyBreakdown[0]?.date} → ${studyPlan.dailyBreakdown[studyPlan.dailyBreakdown.length - 1]?.date}`);

            console.log("\n✨ PROFESSIONAL FEATURES INCLUDED:");
            console.log("• 🎨 Modern formatting with professional blue headers");
            console.log("• 📊 Color-coded units for easy identification");
            console.log("• 📝 Bold text for important information");
            console.log("• 📏 Optimized column widths and row heights");
            console.log("• 🔲 Clean borders and alternating row colors");
            console.log("• 📋 Two worksheets: Daily Schedule + Summary");
            console.log("• ✅ Completion tracking with progress percentages");
            console.log("• 📱 Proper text wrapping for long content");

            console.log("\n💡 EXCEL FEATURES:");
            console.log("• 🎯 Professional blue header with white text");
            console.log("• 🌈 Each Calculus unit has its own color theme");
            console.log("• 📊 Summary sheet with key metrics");
            console.log("• 🔍 Easy to filter and sort data");
            console.log("• 📱 Optimized for both desktop and mobile viewing");
            console.log("• 💾 Native .xlsx format - no encoding issues!");

            console.log("\n🚀 READY TO USE:");
            console.log(`1. 📂 Double-click to open: ${filename}`);
            console.log("2. ✅ Check off completed days in the 'Completed' column");
            console.log("3. 📊 Use the Summary sheet for progress tracking");
            console.log("4. 🎨 All formatting is already applied!");
        } catch (error) {
            console.error("❌ Error generating Excel spreadsheet:", error);
            console.log('\n💡 Try running "check-data" to verify your data files are valid.');
            process.exit(1);
        }
    });

// Error handling
program.exitOverride();

try {
    await program.parseAsync();
} catch (error) {
    const err = error as any;
    if (err.code !== "commander.help" && err.code !== "commander.helpDisplayed") {
        console.error("❌ Error:", err.message || "Unknown error");
        process.exit(1);
    }
}
