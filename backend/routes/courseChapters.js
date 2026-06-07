const express = require("express");
const router = express.Router();
const Chapter = require("../models/CourseChapter"); // Use 'Chapter'

// --- EXISTING ROUTE TO GET CHAPTERS ---
router.post("/get-chapters", async (req, res) => {
  const { program, className, course } = req.body;
  try {
    // Normalize helper: remove non-alphanumerics and lowercase to compare loosely
    const normalize = (s) =>
      (s ?? "")
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .trim();

    const nCourse = normalize(course);

    // Build base filters
    const programFilter = program ? { program: new RegExp(`^${program}$`, "i") } : {};
    const classFilter = className ? { className: new RegExp(`^${className}$`, "i") } : {};

    // 1) Try with program + className (if both exist)
    let docs = await Chapter.find({ ...programFilter, ...classFilter });
    let found = docs.find((d) => normalize(d.course) === nCourse);

    // 2) Fallback: try only with program (ignore className)
    if (!found) {
      docs = await Chapter.find({ ...programFilter });
      found = docs.find((d) => normalize(d.course) === nCourse);
    }

    // 3) Fallback: try across all docs by course only
    if (!found && nCourse) {
      docs = await Chapter.find({});
      found = docs.find((d) => normalize(d.course) === nCourse);
    }

    if (!found) {
      return res.json({ success: true, chp: [] });
    }
    return res.json({ success: true, chp: found.chp || [] });
  } catch (err) {
    console.error("Error in /get-chapters route:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// --- NEW ROUTE TO ADD A CHAPTER ---
router.post("/add-chapter", async (req, res) => {
  const { program, className, course, chapterNo, chapterName } = req.body;

  // Basic validation
  if (!program || !className || !course || !chapterNo || !chapterName) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const updatedCourse = await Chapter.findOneAndUpdate(
      { program, className, course }, // Find the document to update
      { 
        $push: { // Add the new chapter object to the 'chp' array
          chp: { 
            chapterNo: Number(chapterNo), // Ensure chapterNo is a number
            chapterName 
          } 
        } 
      },
      { new: true, upsert: true } // Options: 'new: true' returns the updated doc, 'upsert: true' creates it if not found
    );

    if (!updatedCourse) {
        return res.status(404).json({ success: false, message: "Course not found and could not be created."});
    }

    res.json({ success: true, chp: updatedCourse.chp }); // Send back the updated list of chapters
  } catch (err) {
    console.error("Error in /add-chapter route:", err);
    res.status(500).json({ success: false, message: "Server error while adding chapter." });
  }
});

router.put("/update-chapter", async (req, res) => {
  const { program, className, course, originalChapterNo, newChapterNo, newChapterName } = req.body;

  if (!program || !className || !course || !originalChapterNo || !newChapterNo || !newChapterName) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    // The "chp.chapterNo" query finds the document where the 'chp' array contains an element with the matching chapterNo.
    // The '$' operator in the update ensures only that matched element is updated.
    const updatedCourse = await Chapter.findOneAndUpdate(
      { program, className, course, "chp.chapterNo": originalChapterNo },
      { 
        $set: { 
          "chp.$.chapterNo": Number(newChapterNo),
          "chp.$.chapterName": newChapterName,
        } 
      },
      { new: true } // Return the modified document
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Chapter or course not found." });
    }

    res.json({ success: true, chp: updatedCourse.chp });
  } catch (err) {
    console.error("Error in /update-chapter route:", err);
    res.status(500).json({ success: false, message: "Server error while updating chapter." });
  }
});

// --- NEW ROUTE TO DELETE A CHAPTER ---
router.delete("/delete-chapter", async (req, res) => {
  const { program, className, course, chapterNo } = req.body;

  if (!program || !className || !course || !chapterNo) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const updatedCourse = await Chapter.findOneAndUpdate(
      { program, className, course },
      { 
        $pull: { // Remove the chapter object from the 'chp' array
          chp: { chapterNo: Number(chapterNo) }
        } 
      },
      { new: true } // Return the modified document
    );

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    res.json({ success: true, chp: updatedCourse.chp });
  } catch (err) {
    console.error("Error in /delete-chapter route:", err);
    res.status(500).json({ success: false, message: "Server error while deleting chapter." });
  }
});



module.exports = router;