/**
 * bot.js — Conversational WhatsApp Attendance Bot (whatsapp-web.js)
 *
 * FLOW:
 *  Faculty: "hi"
 *  Bot: Greets + shows CIANN list
 *  Faculty: replies with CIANN number (e.g. "1234")
 *  Bot: "Theory or Practical? Reply T or P"
 *  Faculty: "T" or "P"
 *  Bot: Shows Teaching Plan / Lab Plan entries
 *       If no plan → "No plan found. Create one? Reply YES"
 *  Faculty: "YES"
 *  Bot: Asks for plan details step by step
 *       → Creates plan → confirms
 *
 *  DIRECT ATTENDANCE (advanced):
 *  Faculty: ATT | ciannId | date | topic\nP: 1,3\nA: 2,4
 *  Bot: Saves directly (existing flow)
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const WHATSAPP_AUTH_DATA_PATH = "./whatsapp/auth";
const WHATSAPP_AUTH_CLIENT_ID = "attendance-bot";

// ── Lazy model getters (models registered by server.js on boot) ────────────
const { resolveStudents } = require("../utils/studentHistoryHelper");
const getModel = (name) => mongoose.model(name);

// ── In-memory session store: { "phone": SessionObject } ───────────────────
// Sessions auto-expire after 10 minutes of inactivity
const sessions = new Map();
const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

function getSession(phone) {
    const s = sessions.get(phone);
    if (s) { s.lastActivity = Date.now(); return s; }
    return null;
}

function setSession(phone, data) {
    sessions.set(phone, { ...data, lastActivity: Date.now() });
}

function clearSession(phone) {
    sessions.delete(phone);
}

// Clean up stale sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [phone, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TTL) sessions.delete(phone);
    }
}, 5 * 60 * 1000);

// ── Client Setup ────────────────────────────────────────────────────────────
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: WHATSAPP_AUTH_DATA_PATH,
        clientId: WHATSAPP_AUTH_CLIENT_ID,
    }),
    webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
        strict: false,
    },
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-software-rasterizer",
            "--disable-extensions",
            "--no-zygote",
        ],
    },
});

client.on("loading_screen", (percent, message) => {
    console.log(`🤖 WhatsApp Bot loading: ${percent}% - ${message}`);
});

client.on("qr", (qr) => {
    console.log("\n========================================");
    console.log("📱 Scan this QR with WhatsApp:");
    console.log("========================================\n");
    qrcode.generate(qr, { small: true });
    console.log("\n👉 Once you scan this QR code, the session will be saved automatically for future restarts.\n");
});

client.on("authenticated", () => console.log("✅ WhatsApp Bot: Authenticated successfully. Session saved."));
client.on("auth_failure", (msg) => console.error("❌ WhatsApp Auth Failed:", msg));
client.on("ready", () => console.log("🤖 WhatsApp Attendance Bot is READY!"));
client.on("disconnected", (r) => console.warn("⚠️ WhatsApp Bot disconnected:", r));

let isInitializing = false;
let hasRecoveredFromStartupError = false;

function killStaleBrowserProcesses() {
    try {
        if (process.platform === "win32") {
            execSync("taskkill /F /IM chrome.exe /T", { stdio: "ignore" });
        } else if (process.platform === "darwin") {
            execSync("pkill -f 'Chrom(e|ium)'", { stdio: "ignore" });
        } else {
            execSync("pkill -f chrome", { stdio: "ignore" });
        }
    } catch (_) {
        // No running process to kill is fine.
    }
}

function removeLockArtifacts(baseDir) {
    if (!fs.existsSync(baseDir)) return;

    const names = new Set(["LOCK", "SingletonCookie", "SingletonLock", "SingletonSocket", "DevToolsActivePort"]);
    const queue = [baseDir];

    while (queue.length) {
        const current = queue.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                queue.push(fullPath);
                continue;
            }
            if (!names.has(entry.name)) continue;

            try {
                fs.rmSync(fullPath, { force: true });
            } catch (_) {
                // A locked artifact may remain; init retry will handle next pass.
            }
        }
    }
}

function resetLocalSessionData() {
    const sessionPath = path.resolve(process.cwd(), "whatsapp", "auth");
    const chromeProfilePath = path.join(sessionPath, `session-${WHATSAPP_AUTH_CLIENT_ID}`);

    killStaleBrowserProcesses();
    removeLockArtifacts(chromeProfilePath);
    removeLockArtifacts(sessionPath);

    console.warn("⚠️ Cleared stale WhatsApp browser locks. QR should appear if relogin is needed.");
}

function shouldResetSessionForError(err) {
    const msg = String(err?.message || "").toLowerCase();
    return (
        msg.includes("execution context was destroyed") ||
        msg.includes("runtime.callfunctionon") ||
        msg.includes("browser is already running")
    );
}

function initializeWithRecovery(delayMs = 0) {
    if (isInitializing) return;
    isInitializing = true;

    setTimeout(async () => {
        try {
            await client.initialize();
        } catch (err) {
            console.error("❌ WhatsApp bot initialize failed:", err?.message || err);

            if (!hasRecoveredFromStartupError && shouldResetSessionForError(err)) {
                hasRecoveredFromStartupError = true;
                try {
                    resetLocalSessionData();
                    console.log("🔁 Retrying WhatsApp bot after session reset...");
                    isInitializing = false;
                    initializeWithRecovery(3000);
                    return;
                } catch (resetErr) {
                    console.error("❌ Failed to reset WhatsApp session:", resetErr?.message || resetErr);
                }
            }

            console.log("🔁 Retrying WhatsApp bot in 5s...");
            isInitializing = false;
            initializeWithRecovery(5000);
            return;
        }

        isInitializing = false;
    }, delayMs);
}

// ── Main Message Handler ────────────────────────────────────────────────────
client.on("message", async (message) => {
    // Ignore status broadcasts, group messages, and newsletters
    if (message.isStatus || message.from === 'status@broadcast') return;
    if (message.from.endsWith('@g.us') || message.from.endsWith('@newsletter')) return;

    const raw = message.body?.trim();
    if (!raw) return;

    let phone = message.from.replace("@c.us", "");
    if (message.from.endsWith("@lid")) {
        try {
            const contact = await message.getContact();
            if (contact && contact.number) {
                phone = contact.number;
            } else {
                const mappings = await client.getContactLidAndPhone([message.from]);
                if (mappings && mappings.length > 0 && mappings[0].pn) {
                    phone = mappings[0].pn;
                } else {
                    phone = message.from.replace("@lid", "");
                }
            }
        } catch (err) {
            console.error("Failed to resolve phone from LID:", err);
            phone = message.from.replace("@lid", "");
        }
    }
    const text = raw.toLowerCase();

    // Log incoming message to local file for diagnostic review
    try {
        fs.appendFileSync(
            path.resolve(__dirname, "../incoming_messages.log"),
            `${new Date().toISOString()} | Sender: ${message.from} (Resolved: ${phone}) | Msg: ${raw}\n`
        );
    } catch (logErr) {
        console.error("Failed to write incoming messages log:", logErr);
    }

    console.log(`📨 [${message.from} -> resolved: ${phone}] ${raw.substring(0, 120)}`);

    // ── Roll Number Validation/Attendance Flow (Student/Direct Validation) ─────
    if (isRollNoFormat(raw)) {
        const faculty = await findFaculty(phone);
        // If they are a registered faculty in an active session or executing a faculty flow, bypass this check
        const isFacultySession = faculty && (
            getSession(phone) ||
            ["hi", "hello", "hey", "start", "help", "cancel", "exit", "quit", "reset", "stop"].includes(text) ||
            raw.toUpperCase().startsWith("ATT")
        );

        if (!isFacultySession) {
            try {
                const student = await findStudentByRollNo(raw);
                if (!student) {
                    await message.reply("Roll number is not valid");
                } else {
                    await message.reply(`Attendance marked for ${student.rollNo}`);
                }
                return;
            } catch (err) {
                console.error("Roll number verification error:", err);
                await message.reply("❌ Error checking roll number. Try again.");
                return;
            }
        }
    }

    // ── Verify faculty ────────────────────────────────────────────────────────
    const faculty = await findFaculty(phone);
    if (!faculty) {
        await message.reply(
            "🔒 Your WhatsApp number is not registered.\n" +
            "Ask your admin to add your WhatsApp number in the faculty panel."
        );
        return;
    }

    // ── Direct ATT command (bypasses conversation flow) ───────────────────────
    if (raw.toUpperCase().startsWith("ATT")) {
        clearSession(phone);
        await handleDirectAttendance(message, raw, faculty, phone);
        return;
    }

    // ── Reset / exit commands ─────────────────────────────────────────────────
    if (["cancel", "exit", "quit", "reset", "stop"].includes(text)) {
        clearSession(phone);
        await message.reply("✅ Session cleared. Send *hi* to start again.");
        return;
    }

    // ── Route based on current session state ──────────────────────────────────
    const session = getSession(phone);

    if (!session || ["hi", "hello", "hey", "start", "help"].includes(text)) {
        await handleGreeting(message, faculty, phone);
        return;
    }

    switch (session.state) {
        case "AWAIT_CIANN":
            await handleCiannSelect(message, raw, faculty, phone, session);
            break;
        case "AWAIT_TYPE":
            await handleTypeSelect(message, raw, phone, session);
            break;
        case "AWAIT_PLAN_SELECTION":
            await handlePlanSelection(message, raw, phone, session);
            break;
        case "AWAIT_ABSENT_ROLLS":
            await handleAbsentRolls(message, raw, faculty, phone, session);
            break;
        case "AWAIT_CREATE_CONFIRM":
            await handleCreateConfirm(message, raw, phone, session);
            break;
        case "AWAIT_TP_CHAPTER":
            await handleTpChapter(message, raw, phone, session);
            break;
        case "AWAIT_TP_SUBTOPIC":
            await handleTpSubtopic(message, raw, phone, session);
            break;
        case "AWAIT_TP_DATE":
            await handleTpDate(message, raw, phone, session);
            break;
        case "AWAIT_LP_EXPTNAME":
            await handleLpExptName(message, raw, phone, session);
            break;
        case "AWAIT_LP_DATE":
            await handleLpDate(message, raw, phone, session);
            break;
        default:
            await handleGreeting(message, faculty, phone);
    }
});

// ── Step 1: Greeting + Show CIANNs ─────────────────────────────────────────
async function handleGreeting(message, faculty, phone) {
    try {
        const Ciann = getModel("Ciann");
        const cianns = await Ciann.find({
            $or: [
                { owner: faculty._id },
                { ownerUsername: faculty.generatedUsername },
                { "sharedWith.user": faculty._id },
            ],
            college: faculty.institution,
        }).lean();

        if (cianns.length === 0) {
            await message.reply(
                `👋 Hello *${faculty.fullName}*!\n\n` +
                "❌ You don't have any CIANNs yet.\nCreate one from the faculty portal first."
            );
            return;
        }

        let reply = `👋 Hello *${faculty.fullName}*!\n\n`;
        reply += `📚 *Your CIANNs:*\n`;
        reply += `━━━━━━━━━━━━━━━━━━\n`;

        cianns.forEach((c, i) => {
            reply += `*${i + 1}.* ${c.subject?.name || "Subject"} (${c.subject?.code || ""})\n`;
            reply += `   CIANN ID: *${c.ciannId}* | Div: ${c.division} | Sem ${c.semester}\n\n`;
        });

        reply += `━━━━━━━━━━━━━━━━━━\n`;
        reply += `Reply with the *CIANN ID* (e.g. *${cianns[0].ciannId}*) to continue.\n`;
        reply += `\n_Send "cancel" anytime to reset._`;

        setSession(phone, { state: "AWAIT_CIANN", cianns, faculty });
        await message.reply(reply);
    } catch (err) {
        console.error("handleGreeting error:", err);
        await message.reply("❌ Error loading your CIANNs. Try again later.");
    }
}

// ── Step 2: Faculty selects a CIANN ────────────────────────────────────────
async function handleCiannSelect(message, raw, faculty, phone, session) {
    const ciannId = parseInt(raw);
    if (isNaN(ciannId)) {
        await message.reply("❓ Please reply with a valid *CIANN ID* (4-digit number).\nOr send *hi* to see your list again.");
        return;
    }

    const ciann = session.cianns?.find((c) => c.ciannId === ciannId);
    if (!ciann) {
        await message.reply(`❌ CIANN ID *${ciannId}* not found in your list.\nPlease reply with one of your CIANN IDs.`);
        return;
    }

    setSession(phone, { ...session, state: "AWAIT_TYPE", selectedCiann: ciann });

    await message.reply(
        `✅ Selected: *${ciann.subject?.name}* (${ciann.subject?.code})\n` +
        `Division: ${ciann.division} | Sem ${ciann.semester}\n\n` +
        `📋 What type of attendance?\n` +
        `*T* — Theory (Lecture)\n` +
        `*P* — Practical (Lab)\n\n` +
        `Reply *T* or *P*`
    );
}

// ── Step 3: Theory or Practical ────────────────────────────────────────────
async function handleTypeSelect(message, raw, phone, session) {
    const upper = raw.toUpperCase().trim();
    if (!["T", "P", "THEORY", "PRACTICAL"].includes(upper)) {
        await message.reply("❓ Reply *T* for Theory or *P* for Practical.");
        return;
    }

    const isTheory = ["T", "THEORY"].includes(upper);
    const ciann = session.selectedCiann;

    try {
        let availablePlans = [];
        let reply = "";

        if (isTheory) {
            const TeachingPlan = getModel("TeachingPlan");
            const TheoryAttendance = getModel("TheoryAttendance");
            const plans = await TeachingPlan.find({ ciannId: ciann.ciannId }).lean();
            
            // Get already marked attendances to check which are done
            const markedRecords = await TheoryAttendance.find({ ciannId: ciann.ciannId }).select("date chapter subTopic").lean();
            const markedDates = markedRecords.map(r => r.date);

            let idx = 1;
            plans.forEach((week) => {
                (week.plans || []).forEach((p) => {
                    const isMarked = markedDates.includes(p.startDate);
                    availablePlans.push({
                        index: idx,
                        type: "theory",
                        chapter: p.chapter,
                        subTopic: p.subTopic,
                        date: p.startDate,
                        isMarked
                    });
                    idx++;
                });
            });

            reply += `📖 *Teaching Plan for CIANN ${ciann.ciannId}*\n*${ciann.subject?.name}*\n━━━━━━━━━━━━━━━━━\n`;
        } else {
            const LabPlanning = getModel("LabPlanning");
            const PracticalAttendance = getModel("PracticalAttendance");
            const plans = await LabPlanning.find({ ciannId: ciann.ciannId }).lean();
            
            const markedRecords = await PracticalAttendance.find({ ciannId: ciann.ciannId }).lean();
            const markedSignatures = markedRecords.map(r => `${r.actualDate}-${r.batch}-${r.exptNo}`);

            let idx = 1;
            plans.forEach((week) => {
                (week.plans || []).forEach((p) => {
                    const sig = `${p.date}-${p.batch}-${p.exptNo}`;
                    const isMarked = markedSignatures.includes(sig);
                    availablePlans.push({
                        index: idx,
                        type: "practical",
                        batch: p.batch,
                        exptNo: p.exptNo,
                        exptName: p.exptName,
                        date: p.date,
                        isMarked
                    });
                    idx++;
                });
            });

            reply += `🧪 *Lab Plan for CIANN ${ciann.ciannId}*\n*${ciann.subject?.name}*\n━━━━━━━━━━━━━━━━━\n`;
        }

        if (availablePlans.length > 0) {
            availablePlans.forEach(p => {
                const status = p.isMarked ? "✅ Marked" : "⏳ Pending";
                if (p.type === "theory") {
                    reply += `*${p.index}.* ${p.chapter} — ${p.subTopic}\n   📅 ${p.date} | ${status}\n\n`;
                } else {
                    reply += `*${p.index}.* Batch ${p.batch} | Exp ${p.exptNo}: ${p.exptName}\n   📅 ${p.date} | ${status}\n\n`;
                }
            });
            reply += `━━━━━━━━━━━━━━━━━\n`;
            reply += `Reply with the *Number* (e.g. 1) to mark attendance for that plan.\n`;
            reply += `Or reply *NEW* to create a new plan.`;
            
            setSession(phone, { ...session, state: "AWAIT_PLAN_SELECTION", availablePlans, type: isTheory ? "theory" : "practical" });
            await message.reply(reply);
        } else {
            setSession(phone, { ...session, state: "AWAIT_CREATE_CONFIRM", type: isTheory ? "theory" : "practical" });
            await message.reply(
                `⚠️ No ${isTheory ? 'Teaching' : 'Lab'} Plan found for CIANN *${ciann.ciannId}*.\n\n` +
                `Would you like to create one now?\nReply *YES* to create or *NO* to cancel.`
            );
        }
    } catch (err) {
        console.error("handleTypeSelect error:", err);
        await message.reply("❌ Error checking plan. Please try again.");
    }
}

// ── Step 3.5: User selects a plan from the list or creates a NEW one ────────
async function handlePlanSelection(message, raw, phone, session) {
    if (raw.toUpperCase() === "NEW") {
        return await handleCreateConfirm(message, "YES", phone, session); // Forward to plan creation
    }

    const planIndex = parseInt(raw.trim());
    if (isNaN(planIndex)) {
        await message.reply("❓ Please reply with a valid *Plan Number* from the list, or *NEW* to create one.");
        return;
    }

    const plan = session.availablePlans.find(p => p.index === planIndex);
    if (!plan) {
        await message.reply(`❌ Plan number ${planIndex} not found. Please reply with a valid number.`);
        return;
    }

    if (plan.isMarked) {
        await message.reply(`⚠️ Attendance for this plan is already marked as ✅ Marked.\nPlease select a pending plan or reply *NEW*.`);
        return;
    }

    setSession(phone, { ...session, state: "AWAIT_ABSENT_ROLLS", selectedPlanDetails: plan });

    let reply = `✅ Selected:\n`;
    if (plan.type === "theory") {
        reply += `*${plan.chapter} — ${plan.subTopic}*\n📅 ${plan.date}\n\n`;
    } else {
        reply += `*Batch ${plan.batch} | Exp ${plan.exptNo}: ${plan.exptName}*\n📅 ${plan.date}\n\n`;
    }
    reply += `Enter the *Absent Roll Numbers* separated by commas.\n(e.g., _106, 12, 45_)\n\n`;
    reply += `If everyone is present, reply with *ALL*.`;

    await message.reply(reply);
}

// ── Step 3.6: Mark attendance conversationally ──────────────────────────────
async function handleAbsentRolls(message, raw, faculty, phone, session) {
    const { selectedCiann, selectedPlanDetails, type } = session;
    const ciannId = selectedCiann.ciannId;
    const date = selectedPlanDetails.date;

    const students = await resolveStudents({
        division: selectedCiann.division,
        academicYear: selectedCiann.academicYear,
        semester: selectedCiann.semester
    }, selectedCiann.college || (faculty && faculty.institution));
    
    if (students.length === 0) {
        await message.reply(`⚠️ No students found in Division ${selectedCiann.division}. Add students from the admin panel first.`);
        return;
    }

    let absentRolls = [];
    if (raw.toUpperCase() !== "ALL") {
        // Parse and resolve rolls using the student list for this division
        const studentRolls = students.map(s => String(s.rollNo));
        absentRolls = raw
            .replace(/ROLL/gi, "")
            .split(",")
            .map((s) => matchRollNoInList(s.trim(), studentRolls))
            .filter(Boolean);
    }

    const attendanceStudents = students.map((s) => {
        const status = absentRolls.includes(String(s.rollNo)) ? "Absent" : "Present";
        return { rollNo: String(s.rollNo), studentName: s.studentName, status };
    });

    try {
        if (type === "theory") {
            const TheoryAttendance = getModel("TheoryAttendance");
            await new TheoryAttendance({
                ciannId, 
                date, 
                topic: selectedPlanDetails.subTopic, 
                chapter: selectedPlanDetails.chapter, 
                startDate: date,
                teachingMethod: "WhatsApp",
                remark: `Marked via WhatsApp by ${faculty.fullName}`,
                students: attendanceStudents,
            }).save();
        } else {
            const PracticalAttendance = getModel("PracticalAttendance");
            await new PracticalAttendance({
                ciannId,
                weekNo: 1, // Fallback
                batch: selectedPlanDetails.batch,
                exptNo: selectedPlanDetails.exptNo,
                exptName: selectedPlanDetails.exptName,
                actualDate: date,
                remark: `Marked via WhatsApp by ${faculty.fullName}`,
                students: attendanceStudents
            }).save();
        }

        const present = attendanceStudents.filter((s) => s.status === "Present").length;
        const absent = attendanceStudents.filter((s) => s.status === "Absent").length;

        await message.reply(
            `✅ *Attendance Saved!*\n━━━━━━━━━━━━━━━━━━\n` +
            `📚 ${selectedCiann.subject?.name} (${selectedCiann.subject?.code})\n` +
            `🏷️ CIANN: ${ciannId} | Div: ${selectedCiann.division}\n` +
            `📅 Date: ${date}\n` +
            `━━━━━━━━━━━━━━━━━━\n✅ Present: ${present}\n❌ Absent: ${absent}\n👤 Total: ${students.length}`
        );

        // Reset flow
        clearSession(phone);
    } catch (err) {
        console.error("handleAbsentRolls error:", err);
        await message.reply("❌ Error saving attendance: " + err.message);
    }
}

// ── Step 4a: Confirm plan creation ─────────────────────────────────────────
async function handleCreateConfirm(message, raw, phone, session) {
    if (raw.toUpperCase() === "NO") {
        clearSession(phone);
        await message.reply("❌ Cancelled. Send *hi* to start again.");
        return;
    }
    if (raw.toUpperCase() !== "YES") {
        await message.reply("Reply *YES* to create a plan or *NO* to cancel.");
        return;
    }

    if (session.type === "theory") {
        setSession(phone, { ...session, state: "AWAIT_TP_CHAPTER", newPlan: {} });
        await message.reply(
            `📝 *Create Teaching Plan — Step 1/3*\n\n` +
            `Enter the *Chapter name or number:*\n(e.g. _Chapter 1_ or _Unit 2_)`
        );
    } else {
        setSession(phone, { ...session, state: "AWAIT_LP_EXPTNAME", newPlan: { batch: "B1", exptNo: "1" } });
        await message.reply(
            `🧪 *Create Lab Plan — Step 1/2*\n\n` +
            `Enter the *Experiment Name:*\n(e.g. _Introduction to Arduino_)`
        );
    }
}

// ── Teaching Plan creation steps ───────────────────────────────────────────
async function handleTpChapter(message, raw, phone, session) {
    setSession(phone, { ...session, state: "AWAIT_TP_SUBTOPIC", newPlan: { ...session.newPlan, chapter: raw } });
    await message.reply(
        `✅ Chapter: *${raw}*\n\n` +
        `*Step 2/3* — Enter the *Sub Topic / Lecture title:*\n(e.g. _Introduction to Data Structures_)`
    );
}

async function handleTpSubtopic(message, raw, phone, session) {
    setSession(phone, { ...session, state: "AWAIT_TP_DATE", newPlan: { ...session.newPlan, subTopic: raw } });
    await message.reply(
        `✅ Sub Topic: *${raw}*\n\n` +
        `*Step 3/3* — Enter the *Start Date* (YYYY-MM-DD):\n(e.g. _${todayStr()}_)`
    );
}

async function handleTpDate(message, raw, phone, session) {
    if (!isValidDate(raw)) {
        await message.reply(`❌ Invalid date format. Use YYYY-MM-DD (e.g. ${todayStr()})`);
        return;
    }
    const { selectedCiann, newPlan } = session;
    try {
        const TeachingPlan = getModel("TeachingPlan");
        await TeachingPlan.findOneAndUpdate(
            { ciannId: selectedCiann.ciannId, weekNo: 1 },
            { $set: { plans: [{ chapter: newPlan.chapter, subTopic: newPlan.subTopic, startDate: raw, endDate: raw, teachingMethod: "Lecture" }] } },
            { upsert: true, new: true }
        );
        clearSession(phone);
        await message.reply(
            `✅ *Teaching Plan Created!*\n\n` +
            `📚 CIANN: ${selectedCiann.ciannId}\n` +
            `📖 ${newPlan.chapter} — ${newPlan.subTopic}\n` +
            `📅 Date: ${raw}\n\n` +
            `Would you like to mark attendance for this plan now?\n` +
            `Enter the *Absent Roll Numbers* separated by commas.\n(e.g., _106, 12, 45_)\nIf everyone is present, reply with *ALL*.`
        );
        // Seamlessly move them to the Absent Rolls state
        setSession(phone, { 
            ...session, 
            state: "AWAIT_ABSENT_ROLLS", 
            type: "theory", 
            selectedPlanDetails: {
                chapter: newPlan.chapter,
                subTopic: newPlan.subTopic,
                date: raw,
                type: "theory"
            }
        });
    } catch (err) {
        console.error("handleTpDate error:", err);
        await message.reply("❌ Error saving teaching plan. Try again.");
    }
}

// ── Lab Plan creation steps ─────────────────────────────────────────────────
async function handleLpExptName(message, raw, phone, session) {
    setSession(phone, { ...session, state: "AWAIT_LP_DATE", newPlan: { ...session.newPlan, exptName: raw } });
    await message.reply(
        `✅ Experiment: *${raw}*\n\n` +
        `*Step 2/2* — Enter the *Planned Date* (YYYY-MM-DD):\n(e.g. _${todayStr()}_)`
    );
}

async function handleLpDate(message, raw, phone, session) {
    if (!isValidDate(raw)) {
        await message.reply(`❌ Invalid date. Use YYYY-MM-DD (e.g. ${todayStr()})`);
        return;
    }
    const { selectedCiann, newPlan } = session;
    try {
        const LabPlanning = getModel("LabPlanning");
        await LabPlanning.findOneAndUpdate(
            { ciannId: selectedCiann.ciannId, weekNo: 1 },
            { $set: { plans: [{ batch: "B1", exptNo: "1", exptName: newPlan.exptName, date: raw }] } },
            { upsert: true, new: true }
        );
        clearSession(phone);
        await message.reply(
            `✅ *Lab Plan Created!*\n\n` +
            `🧪 CIANN: ${selectedCiann.ciannId}\n` +
            `Batch B1 | Exp 1: ${newPlan.exptName}\n` +
            `📅 Date: ${raw}\n\n` +
            `Would you like to mark attendance for this plan now?\n` +
            `Enter the *Absent Roll Numbers* separated by commas.\n(e.g., _106, 12, 45_)\nIf everyone is present, reply with *ALL*.`
        );
        // Seamlessly move them to the Absent Rolls state
        setSession(phone, { 
            ...session, 
            state: "AWAIT_ABSENT_ROLLS", 
            type: "practical", 
            selectedPlanDetails: {
                batch: "B1",
                exptNo: "1",
                exptName: newPlan.exptName,
                date: raw,
                type: "practical"
            }
        });
    } catch (err) {
        console.error("handleLpDate error:", err);
        await message.reply("❌ Error saving lab plan. Try again.");
    }
}

// ── Direct ATT command handler ───────────────────────────────────────────────
async function handleDirectAttendance(message, body, faculty, phone) {
    const rawText = body.trim();
    
    // We want to handle chaotic formatting like:
    // ATT|1340|2026-03-05 introduction to robotics A: 106, 107
    // Or nicely formatted ones.
    
    // 1. Extract CIANN and Date. They are usually the first things after ATT.
    // EReg: ATT\s*\|?\s*(\d{4,5})\s*\|?\s*(\d{4}-\d{2}-\d{2})
    const headerSetup = rawText.match(/ATT\s*\|?\s*(\d{4,5})\s*\|?\s*(\d{4}-\d{2}-\d{2})/i);
    
    if (!headerSetup) {
        await message.reply("❓ Wrong format.\nUse:\n*ATT | ciannId | YYYY-MM-DD | Topic*\n*A: 2,4,6* (absent rolls)");
        return;
    }

    const ciannId = parseInt(headerSetup[1]);
    const date = headerSetup[2];
    
    // 2. Extract everything AFTER the date as the "rest" of the message
    let restOfMessage = rawText.substring(headerSetup.index + headerSetup[0].length).trim();
    if (restOfMessage.startsWith("|")) restOfMessage = restOfMessage.substring(1).trim();

    // 3. Extract P: and A: blocks
    // This regex looks for P: or A: followed by numbers/commas/spaces/the word "roll", until the end of string or another P:/A:
    const pMatch = restOfMessage.match(/P:\s*([\d\s,roll]+)(?=(?:A:|$))/i);
    const aMatch = restOfMessage.match(/A:\s*([\d\s,roll]+)(?=(?:P:|$))/i);
    
    let presentRolls = [], absentRolls = [];
    let hasPresentLine = false, hasAbsentLine = false;

    if (isNaN(ciannId)) { await message.reply("❌ Invalid CIANN ID."); return; }
    if (!isValidDate(date)) { await message.reply("❌ Invalid date. Use YYYY-MM-DD."); return; }
    if (new Date(date) > new Date()) { await message.reply("❌ Cannot mark future attendance."); return; }

    try {
        const Ciann = getModel("Ciann");
        const ciann = await Ciann.findOne({ ciannId }).lean();
        if (!ciann) { await message.reply(`❌ CIANN ${ciannId} not found.`); return; }

        const TheoryAttendance = getModel("TheoryAttendance");
        const existing = await TheoryAttendance.findOne({ ciannId, date }).lean();
        if (existing) {
            const p = existing.students.filter((s) => s.status === "Present").length;
            await message.reply(`⚠️ Attendance already marked for ${date}.\n${p} present. Edit via portal.`);
            return;
        }

        const students = await resolveStudents({
            division: ciann.division,
            academicYear: ciann.academicYear,
            semester: ciann.semester
        }, ciann.college);

        if (students.length === 0) {
            await message.reply(`⚠️ No students found in Division ${ciann.division}. Add students from the admin panel first.`);
            return;
        }

        const studentRolls = students.map(s => String(s.rollNo));

        if (pMatch) {
            hasPresentLine = true;
            presentRolls = pMatch[1]
                .replace(/ROLL/gi, "")
                .split(",")
                .map((s) => matchRollNoInList(s.trim(), studentRolls))
                .filter(Boolean);
            restOfMessage = restOfMessage.replace(pMatch[0], "").trim();
        }
        
        if (aMatch) {
            hasAbsentLine = true;
            absentRolls = aMatch[1]
                .replace(/ROLL/gi, "")
                .split(",")
                .map((s) => matchRollNoInList(s.trim(), studentRolls))
                .filter(Boolean);
            restOfMessage = restOfMessage.replace(aMatch[0], "").trim();
        }
        
        // What's left of the message after stripping P: and A: is the Topic.
        let topic = restOfMessage.replace(/\|/g, "").trim();

        const attendanceStudents = students.map((s) => {
            const sRoll = String(s.rollNo);
            let status = "Present"; // Default is everyone is present!

            if (hasPresentLine && !hasAbsentLine) {
                // If they ONLY provided P:, everyone else is Absent
                status = presentRolls.includes(sRoll) ? "Present" : "Absent";
            } else if (!hasPresentLine && hasAbsentLine) {
                // If they ONLY provided A:, everyone else is Present
                status = absentRolls.includes(sRoll) ? "Absent" : "Present";
            } else if (hasPresentLine && hasAbsentLine) {
                // Both provided: explicit takes priority, default absent if not in P:
                if (absentRolls.includes(sRoll)) status = "Absent";
                else if (presentRolls.includes(sRoll)) status = "Present";
                else status = "Absent";
            }

            return { rollNo: sRoll, studentName: s.studentName, status };
        });

        await new TheoryAttendance({
            ciannId, date, topic: topic || "Not specified", chapter: "", startDate: date,
            teachingMethod: "WhatsApp",
            remark: `Marked via WhatsApp by ${faculty.fullName}`,
            students: attendanceStudents,
        }).save();

        const present = attendanceStudents.filter((s) => s.status === "Present").length;
        const absent = attendanceStudents.filter((s) => s.status === "Absent").length;

        await message.reply(
            `✅ *Attendance Saved!*\n━━━━━━━━━━━━━━━━━━\n` +
            `📚 ${ciann.subject?.name} (${ciann.subject?.code})\n` +
            `🏷️ CIANN: ${ciannId} | Div: ${ciann.division}\n` +
            `📅 Date: ${date} | Topic: ${topic || "N/A"}\n` +
            `━━━━━━━━━━━━━━━━━━\n✅ Present: ${present}\n❌ Absent: ${absent}\n👤 Total: ${students.length}`
        );
    } catch (err) {
        console.error("Direct ATT error:", err);
        await message.reply("❌ Error saving attendance: " + err.message);
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function findFaculty(phone) {
    try {
        const Faculty = getModel("Faculty");
        
        // Clean the incoming phone number (keep only digits)
        const cleanPhone = String(phone || "").replace(/\D/g, "");
        const last10 = cleanPhone.slice(-10);

        if (last10.length < 10) {
            // Fallback to exact matching if the phone number is too short
            return await Faculty.findOne({
                $or: [
                    { whatsappPhone: phone },
                    { whatsappPhone: `+${phone}` }
                ],
                status: "active"
            }).lean();
        }

        // Find active faculties matching the phone number exactly, with +, or by the last 10 digits suffix
        const faculty = await Faculty.findOne({
            $or: [
                { whatsappPhone: phone },
                { whatsappPhone: `+${phone}` },
                { whatsappPhone: { $regex: new RegExp(last10 + "$") } }
            ],
            status: "active"
        }).lean();
        return faculty;
    } catch (err) {
        console.error("findFaculty error:", err);
        return null;
    }
}

function isValidDate(str) {
    return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function todayStr() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().split("T")[0];
}

function isRollNoFormat(input) {
    if (!input || typeof input !== "string") return false;
    const cleaned = input.trim().toUpperCase();
    return /^\d{5}[A-Z]\d{4}$/.test(cleaned) || /^\d{1,4}$/.test(cleaned);
}

async function findStudentByRollNo(input) {
    if (!input || typeof input !== "string") return null;
    const cleaned = input.trim().toUpperCase();

    // 1. If it's a full roll number (5 digits + 1 letter + 4 digits)
    if (/^\d{5}[A-Z]\d{4}$/.test(cleaned)) {
        const Student = getModel("Student");
        return await Student.findOne({ rollNo: cleaned }).lean();
    }

    // 2. If it's a short roll number (1 to 4 digits)
    if (/^\d{1,4}$/.test(cleaned)) {
        const Student = getModel("Student");
        const suffix = cleaned.padStart(4, '0');
        // Look for exact match (e.g. "106") or suffix match (e.g. ending with "0056")
        return await Student.findOne({
            $or: [
                { rollNo: cleaned },
                { rollNo: { $regex: new RegExp(suffix + "$") } }
            ]
        }).lean();
    }

    return null;
}

function matchRollNoInList(input, studentRolls) {
    if (!input || typeof input !== "string") return null;
    const cleaned = input.trim().toUpperCase();

    // If it's a full roll number, return it if it is in the list
    if (/^\d{5}[A-Z]\d{4}$/.test(cleaned)) {
        return studentRolls.find(r => r.toUpperCase() === cleaned) || null;
    }

    // If it's a short roll number, check suffix
    if (/^\d{1,4}$/.test(cleaned)) {
        const suffix = cleaned.padStart(4, '0');
        return studentRolls.find(r => {
            const rUpper = r.toUpperCase();
            return rUpper === cleaned || rUpper.endsWith(suffix);
        }) || null;
    }

    // Otherwise, fallback to exact string match
    return studentRolls.find(r => r.toUpperCase() === cleaned) || null;
}

// ── Start ────────────────────────────────────────────────────────────────────
function startWhatsAppBot() {
    console.log("🚀 Starting Conversational WhatsApp Attendance Bot...");
    try {
        resetLocalSessionData();
    } catch (err) {
        console.error("Warning: Failed to clear session locks:", err.message);
    }
    initializeWithRecovery();
}

module.exports = { startWhatsAppBot, client, isRollNoFormat, findStudentByRollNo, matchRollNoInList };
