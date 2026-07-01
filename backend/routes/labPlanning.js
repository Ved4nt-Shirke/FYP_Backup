const express = require('express');
const router = express.Router();
const LabPlanning = require('../models/LabPlanning');
const PracticalAttendance = require('../models/PracticalAttendance');
const checkCiaanFreeze = require('../middleware/checkFreeze');
const Student = require('../models/Student');
const { resolveStudents } = require('../utils/studentHistoryHelper');
const Ciaan = require('../models/Ciann');

// GET all lab plans
router.get('/', async (req, res) => {
  try {
    const plans = await LabPlanning.find().lean();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET lab plans for a specific CiaanId
router.get('/:CiaanId', async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: 'Invalid CiaanId format' });
    }

    const plans = await LabPlanning.find({ CiaanId: numericCiaanId }).lean();
    // Return empty array if no plans found (not 404 - that's a valid state)
    res.json(plans || []);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new lab plan (with upsert functionality)
router.post('/', checkCiaanFreeze, async (req, res) => {
  let sanitizedPlans = []; // Declare outside try block for access in catch
  let CiaanId, weekNo; // Declare at function level for access in nested catch

  try {
    console.log('POST /api/lab-planning - Request body:', req.body);
    const reqData = req.body;
    CiaanId = reqData.CiaanId;
    weekNo = reqData.weekNo;
    const plans = reqData.plans;

    // Validation
    if (!CiaanId) {
      return res.status(400).json({ message: 'CiaanId is required' });
    }
    if (!weekNo) {
      return res.status(400).json({ message: 'weekNo is required' });
    }
    if (!plans || !Array.isArray(plans)) {
      return res.status(400).json({ message: 'plans must be an array' });
    }

    // Validate each plan entry: only validate rows that have data
    // (filter out empty rows where all fields are empty)
    // A row is considered "filled" only if it has BOTH exptNo and exptName
    const filledPlans = plans.filter(p => (p.exptNo?.trim() || '') && (p.exptName?.trim() || ''));

    for (const plan of filledPlans) {
      // If the row is filled, ALL fields must be provided
      if (!plan.batch?.trim() || !plan.exptNo?.trim() || !plan.exptName?.trim() || !plan.date?.trim()) {
        return res.status(400).json({
          message: 'Each filled plan row must have batch, exptNo, exptName, and date'
        });
      }
    }

    // Only save non-empty plans (if no filled plans, save empty array)
    sanitizedPlans = filledPlans;

    console.log('Creating/updating lab plan with:', { CiaanId, weekNo, plans: sanitizedPlans });

    // Save lab plan - handle the old weekNo index issue
    let savedPlan;
    let upsertAttempts = 0;

    const attemptUpsert = async () => {
      try {
        // Try upsert with findOneAndUpdate first
        savedPlan = await LabPlanning.findOneAndUpdate(
          { CiaanId, weekNo },
          { plans: sanitizedPlans },
          { upsert: true, new: true }
        );
        console.log('Lab plan saved successfully with upsert');
        return true;
      } catch (upsertError) {
        console.error('Upsert error code:', upsertError.code);
        console.error('Upsert error message:', upsertError.message);
        console.error('Full error:', upsertError);

        // If upsert fails due to old weekNo index (code 11000), try to fix it
        if (upsertError.code === 11000 || upsertError.message.includes('E11000')) {
          console.log('Detected E11000 duplicate key error (old weekNo index)');
          upsertAttempts++;

          if (upsertAttempts === 1) {
            // First attempt: try to drop the old weekNo index
            try {
              console.log('Attempting to drop old weekNo index...');
              await LabPlanning.collection.dropIndex('weekNo_1');
              console.log('Successfully dropped weekNo_1 index, retrying upsert...');
              return attemptUpsert(); // Recursive retry after dropping index
            } catch (dropError) {
              console.error('Could not drop index:', dropError.message);
              // Continue to replaceOne approach
            }
          }

          // Second attempt: use replaceOne as fallback
          try {
            console.log('Using collection.replaceOne as fallback...');
            const result = await LabPlanning.collection.replaceOne(
              { CiaanId, weekNo },
              { CiaanId, weekNo, plans: sanitizedPlans },
              { upsert: true }
            );
            console.log('ReplaceOne succeeded, modifiedCount:', result.modifiedCount, 'upsertedId:', result.upsertedId);

            // Fetch the updated document
            savedPlan = await LabPlanning.findOne({ CiaanId, weekNo });
            if (!savedPlan) {
              throw new Error('Could not fetch document after replaceOne');
            }
            console.log('Successfully fetched lab plan after replaceOne');
            return true;
          } catch (replaceError) {
            console.error('ReplaceOne failed:', replaceError);
            // Try collection.updateOne as final fallback
            try {
              console.log('Trying collection.updateOne as final fallback...');
              await LabPlanning.collection.updateOne(
                { CiaanId, weekNo },
                { $set: { plans: sanitizedPlans } },
                { upsert: true }
              );
              savedPlan = await LabPlanning.findOne({ CiaanId, weekNo });
              if (!savedPlan) {
                throw new Error('Could not fetch document after updateOne');
              }
              console.log('Successfully saved via updateOne fallback');
              return true;
            } catch (updateError) {
              console.error('UpdateOne also failed:', updateError);
              throw updateError;
            }
          }
        } else {
          // Different error, not a duplicate key error
          throw upsertError;
        }
      }
    };

    const success = await attemptUpsert();
    if (!success) {
      throw new Error('Could not save lab plan after multiple attempts');
    }

    if (!savedPlan) {
      console.error('Failed to fetch saved lab plan');
      return res.status(500).json({ message: 'Lab plan saved but could not retrieve it' });
    }

    console.log('Lab plan saved and retrieved successfully');

    // Sync lab plan to practical attendance (non-blocking)
    if (sanitizedPlans.length > 0) {
      syncLabPlanToPracticalAttendance(CiaanId, weekNo, sanitizedPlans)
        .then(() => console.log('Synced lab plan to practical attendance'))
        .catch(syncError => console.error('Error syncing to practical attendance:', syncError));
    }

    res.status(201).json(savedPlan);
  } catch (error) {
    console.error('Error creating/updating lab plan:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      message: 'Error creating lab plan: ' + error.message,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PUT to update a lab plan by CiaanId and weekNo
router.put('/:CiaanId/:weekNo', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId, weekNo } = req.params;
    const { plans } = req.body;

    const numericCiaanId = parseInt(CiaanId);
    const numericWeekNo = parseInt(weekNo);

    if (isNaN(numericCiaanId) || isNaN(numericWeekNo)) {
      return res.status(400).json({ message: 'Invalid CiaanId or weekNo format' });
    }

    const updatedPlan = await LabPlanning.findOneAndUpdate(
      { CiaanId: numericCiaanId, weekNo: numericWeekNo },
      { plans },
      { new: true, upsert: true }
    );
    res.json(updatedPlan);
  } catch (error) {
    res.status(400).json({ message: 'Error updating lab plan', error: error.message });
  }
});

// PUT to update a specific plan entry within a lab plan
router.put('/:CiaanId/:weekNo/:batch/:exptNo', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId, weekNo, batch, exptNo } = req.params;
    const { actualDate, remark } = req.body;

    const numericCiaanId = parseInt(CiaanId);
    const numericWeekNo = parseInt(weekNo);

    if (isNaN(numericCiaanId) || isNaN(numericWeekNo)) {
      return res.status(400).json({ message: 'Invalid CiaanId or weekNo format' });
    }

    // Find the lab plan and update the specific plan entry
    const labPlan = await LabPlanning.findOne({
      CiaanId: numericCiaanId,
      weekNo: numericWeekNo
    });

    if (!labPlan) {
      return res.status(404).json({ message: 'Lab plan not found' });
    }

    // Find and update the specific plan entry
    const planIndex = labPlan.plans.findIndex(plan =>
      plan.batch === batch && plan.exptNo === exptNo
    );

    if (planIndex === -1) {
      return res.status(404).json({ message: 'Plan entry not found' });
    }

    // Update the plan entry
    labPlan.plans[planIndex].actualDate = actualDate;
    labPlan.plans[planIndex].remark = remark;

    await labPlan.save();

    res.json({
      message: 'Plan entry updated successfully',
      updatedPlan: labPlan.plans[planIndex]
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating plan entry', error: error.message });
  }
});

// DELETE all lab plans for a specific CiaanId (for cleanup/reset)
router.delete('/Ciaan/:CiaanId', checkCiaanFreeze, async (req, res) => {
  try {
    const { CiaanId } = req.params;
    const numericCiaanId = parseInt(CiaanId);

    if (isNaN(numericCiaanId)) {
      return res.status(400).json({ message: 'Invalid CiaanId format' });
    }

    const result = await LabPlanning.deleteMany({ CiaanId: numericCiaanId });
    res.json({
      message: `Deleted ${result.deletedCount} lab plans for Ciaan ${numericCiaanId}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lab plans', error: error.message });
  }
});

// Helper function: Sync lab plans to practical attendance
async function syncLabPlanToPracticalAttendance(CiaanId, weekNo, plans) {
  try {
    console.log(`Syncing lab plans to practical attendance for Ciaan ${CiaanId}, Week ${weekNo}`);

    // Get all students for this Ciaan by querying division
    const ciaanDoc = await Ciaan.findOne({ CiaanId: parseInt(CiaanId) });
    if (!ciaanDoc) {
      console.log(`Ciaan ${CiaanId} not found - skipping attendance sync`);
      return;
    }

    const divisionId = ciaanDoc.divisionId || ciaanDoc.division;
    if (!divisionId) {
      console.log(`Ciaan ${CiaanId} has no division - skipping attendance sync`);
      return;
    }

    // Get all students in this division/batch historically
    const students = await resolveStudents({
      divisionId: ciaanDoc.divisionId,
      division: ciaanDoc.division,
      academicYear: ciaanDoc.academicYear,
      semester: ciaanDoc.semester
    }, ciaanDoc.college);

    if (students.length === 0) {
      console.log(`No students found for Ciaan ${CiaanId}`);
      return;
    }

    // For each plan (each batch), create or update practical attendance
    for (const plan of plans) {
      if (!plan.batch || !plan.exptNo || !plan.exptName || !plan.date) {
        continue; // Skip incomplete plans
      }

      // Create student attendance array with default "Absent" status
      const studentAttendance = students.map(student => ({
        rollNo: student.rollNo,
        studentName: student.studentName,
        status: 'Absent' // Default to absent, faculty can mark present
      }));

      // Create or update practical attendance record
      const attendanceFilter = {
        CiaanId,
        weekNo,
        batch: plan.batch,
        exptNo: plan.exptNo
      };

      const attendanceData = {
        exptName: plan.exptName,
        actualDate: plan.date,
        students: studentAttendance
      };

      await PracticalAttendance.findOneAndUpdate(
        attendanceFilter,
        attendanceData,
        { upsert: true, new: true }
      );

      console.log(`Created/updated practical attendance for batch ${plan.batch}, expt ${plan.exptNo}`);
    }
  } catch (error) {
    console.error('Error in syncLabPlanToPracticalAttendance:', error);
    // Don't throw - sync failures shouldn't break the operation
  }
}

module.exports = router;