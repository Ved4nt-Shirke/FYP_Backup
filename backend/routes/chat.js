const express = require("express");
const mongoose = require("mongoose");

const { authenticate } = require("../middleware/auth");
const ChatConversation = require("../models/ChatConversation");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/user");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");

const router = express.Router();

router.use(authenticate);

const ensureStudentOrFaculty = (req, res, next) => {
  if (req.user?.role !== "student" && req.user?.role !== "faculty") {
    return res
      .status(403)
      .json({ message: "Chat is available only for students and faculty." });
  }
  return next();
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildDisplayName = async (user) => {
  if (!user) return "User";

  if (user.role === "student") {
    const student = await Student.findOne({
      username: {
        $regex: new RegExp(
          `^${escapeRegex(String(user.username || ""))}$`,
          "i",
        ),
      },
    }).select("studentName");
    return student?.studentName || user.username;
  }

  if (user.role === "faculty") {
    const faculty = await Faculty.findOne({
      generatedUsername: {
        $regex: new RegExp(
          `^${escapeRegex(String(user.username || ""))}$`,
          "i",
        ),
      },
    }).select("fullName");
    return faculty?.fullName || user.username;
  }

  return user.username;
};

const getDepartmentName = async (user) => {
  if (!user?.department) return "";
  try {
    const populated = await User.findById(user._id).populate(
      "department",
      "name",
    );
    return populated?.department?.name || "";
  } catch {
    return "";
  }
};

const isParticipant = (conversation, userId) => {
  const asString = String(userId);
  return conversation.participants.some((p) => String(p.userId) === asString);
};

router.get("/faculty-list", ensureStudentOrFaculty, async (req, res) => {
  try {
    const institutionCode = String(req.user.college || "").trim();

    // Primary source: Faculty collection (institution-scoped) for accurate full names.
    const facultyRecords = await Faculty.find({
      institution: {
        $regex: new RegExp(`^${escapeRegex(institutionCode)}$`, "i"),
      },
      status: { $ne: "inactive" },
    })
      .populate("department", "name")
      .select("fullName generatedUsername department institution")
      .sort({ fullName: 1 });

    const facultyUsernames = facultyRecords
      .map((faculty) => String(faculty.generatedUsername || "").trim())
      .filter(Boolean);

    let usersByUsername = new Map();
    if (facultyUsernames.length > 0) {
      const facultyUsers = await User.find({
        role: "faculty",
        college: {
          $regex: new RegExp(`^${escapeRegex(institutionCode)}$`, "i"),
        },
        username: {
          $in: facultyUsernames,
        },
      }).select("_id username");

      usersByUsername = new Map(
        facultyUsers.map((userDoc) => [
          String(userDoc.username || "").toLowerCase(),
          userDoc,
        ]),
      );
    }

    const list = facultyRecords
      .map((faculty) => {
        const key = String(faculty.generatedUsername || "").toLowerCase();
        const userDoc = usersByUsername.get(key);
        if (!userDoc) return null;

        return {
          id: userDoc._id,
          username: userDoc.username,
          name: faculty.fullName || userDoc.username,
          department: faculty?.department?.name || "",
        };
      })
      .filter(Boolean);

    // Fallback: if Faculty records are missing, fall back to User collection.
    if (list.length === 0) {
      const facultyUsers = await User.find({
        role: "faculty",
        college: {
          $regex: new RegExp(`^${escapeRegex(institutionCode)}$`, "i"),
        },
      })
        .select("username department")
        .populate("department", "name")
        .sort({ username: 1 });

      const fallbackUsernames = facultyUsers
        .map((item) => String(item.username || "").trim())
        .filter(Boolean);

      const fallbackFacultyProfiles = await Faculty.find({
        generatedUsername: { $in: fallbackUsernames },
      }).select("generatedUsername fullName");

      const fallbackNameMap = new Map(
        fallbackFacultyProfiles.map((item) => [
          String(item.generatedUsername || "").toLowerCase(),
          item.fullName,
        ]),
      );

      const fallbackList = facultyUsers.map((userDoc) => ({
        id: userDoc._id,
        username: userDoc.username,
        name:
          fallbackNameMap.get(String(userDoc.username || "").toLowerCase()) ||
          userDoc.username,
        department: userDoc?.department?.name || "",
      }));

      return res.json(fallbackList);
    }

    res.json(list);
  } catch (error) {
    console.error("Failed to fetch faculty list:", error);
    res.status(500).json({ message: "Failed to fetch faculty list" });
  }
});

router.post(
  "/conversations/start",
  ensureStudentOrFaculty,
  async (req, res) => {
    try {
      const { facultyId } = req.body;
      const currentUser = req.user;

      if (currentUser.role !== "student") {
        return res
          .status(403)
          .json({ message: "Only students can start a new conversation." });
      }

      if (!facultyId || !mongoose.Types.ObjectId.isValid(facultyId)) {
        return res.status(400).json({ message: "Invalid facultyId" });
      }

      const facultyUser = await User.findOne({
        _id: facultyId,
        role: "faculty",
        college: currentUser.college,
      });

      if (!facultyUser) {
        return res
          .status(404)
          .json({ message: "Faculty member not found in your institution." });
      }

      let conversation = await ChatConversation.findOne({
        institutionCode: currentUser.college,
        facultyId: facultyUser._id,
        studentId: currentUser._id,
      });

      if (!conversation) {
        const [studentName, facultyName, departmentName] = await Promise.all([
          buildDisplayName(currentUser),
          buildDisplayName(facultyUser),
          getDepartmentName(facultyUser),
        ]);

        conversation = await ChatConversation.create({
          institutionCode: currentUser.college,
          participants: [
            {
              userId: currentUser._id,
              role: currentUser.role,
              username: currentUser.username,
            },
            {
              userId: facultyUser._id,
              role: facultyUser.role,
              username: facultyUser.username,
            },
          ],
          facultyId: facultyUser._id,
          facultyName,
          studentId: currentUser._id,
          studentName,
          departmentName,
          lastMessage: "",
          lastMessageAt: new Date(),
        });
      }

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  },
);

router.get("/conversations", ensureStudentOrFaculty, async (req, res) => {
  try {
    const currentUser = req.user;
    const {
      search = "",
      department = "",
      includeArchived = "false",
    } = req.query;

    const baseQuery = {
      institutionCode: currentUser.college,
      participants: { $elemMatch: { userId: currentUser._id } },
    };

    if (currentUser.role === "faculty") {
      baseQuery.facultyId = currentUser._id;
    }

    if (currentUser.role === "student") {
      baseQuery.studentId = currentUser._id;
    }

    if (includeArchived !== "true") {
      baseQuery.archivedBy = { $ne: currentUser._id };
    }

    if (department) {
      baseQuery.departmentName = { $regex: new RegExp(`^${department}$`, "i") };
    }

    const conversations = await ChatConversation.find(baseQuery).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    });

    const searchValue = String(search || "")
      .trim()
      .toLowerCase();

    const decorated = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await ChatMessage.countDocuments({
          conversationId: conversation._id,
          senderId: { $ne: currentUser._id },
          "seenBy.userId": { $ne: currentUser._id },
        });

        const displayName =
          currentUser.role === "faculty"
            ? conversation.studentName || conversation.studentId
            : conversation.facultyName || conversation.facultyId;

        return {
          ...conversation.toObject(),
          displayName,
          unreadCount,
          isMuted: conversation.mutedBy.some(
            (id) => String(id) === String(currentUser._id),
          ),
        };
      }),
    );

    const filtered = searchValue
      ? decorated.filter((conv) => {
          const searchable = [
            conv.displayName,
            conv.lastMessage,
            conv.departmentName,
          ]
            .join(" ")
            .toLowerCase();
          return searchable.includes(searchValue);
        })
      : decorated;

    res.json(filtered);
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

router.get(
  "/conversations/:id/messages",
  ensureStudentOrFaculty,
  async (req, res) => {
    try {
      const conversation = await ChatConversation.findById(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await ChatMessage.find({
        conversationId: conversation._id,
      }).sort({
        createdAt: 1,
      });

      await ChatMessage.updateMany(
        {
          conversationId: conversation._id,
          senderId: { $ne: req.user._id },
          "seenBy.userId": { $ne: req.user._id },
        },
        {
          $addToSet: {
            seenBy: { userId: req.user._id, seenAt: new Date() },
          },
        },
      );

      res.json(messages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  },
);

router.post("/messages", ensureStudentOrFaculty, async (req, res) => {
  try {
    const { conversationId, body } = req.body;
    const trimmedBody = String(body || "").trim();

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }

    if (!trimmedBody) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!isParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const senderName = await buildDisplayName(req.user);

    const message = await ChatMessage.create({
      conversationId: conversation._id,
      institutionCode: conversation.institutionCode,
      senderId: req.user._id,
      senderRole: req.user.role,
      senderName,
      body: trimmedBody,
      deliveredAt: new Date(),
      seenBy: [{ userId: req.user._id, seenAt: new Date() }],
    });

    conversation.lastMessage = trimmedBody;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastSenderRole = req.user.role;
    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

router.get("/unread-count", ensureStudentOrFaculty, async (req, res) => {
  try {
    const conversations = await ChatConversation.find({
      institutionCode: req.user.college,
      participants: { $elemMatch: { userId: req.user._id } },
      archivedBy: { $ne: req.user._id },
    }).select("_id");

    const conversationIds = conversations.map((c) => c._id);

    if (conversationIds.length === 0) {
      return res.json({ unreadCount: 0 });
    }

    const unreadCount = await ChatMessage.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: req.user._id },
      "seenBy.userId": { $ne: req.user._id },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

router.post(
  "/conversations/:id/mute",
  ensureStudentOrFaculty,
  async (req, res) => {
    try {
      const conversation = await ChatConversation.findById(req.params.id);
      if (!conversation)
        return res.status(404).json({ message: "Conversation not found" });
      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const alreadyMuted = conversation.mutedBy.some(
        (id) => String(id) === String(req.user._id),
      );

      if (alreadyMuted) {
        conversation.mutedBy = conversation.mutedBy.filter(
          (id) => String(id) !== String(req.user._id),
        );
      } else {
        conversation.mutedBy.push(req.user._id);
      }

      await conversation.save();
      res.json({ muted: !alreadyMuted });
    } catch (error) {
      console.error("Failed to update mute state:", error);
      res.status(500).json({ message: "Failed to update mute state" });
    }
  },
);

router.post(
  "/conversations/:id/archive",
  ensureStudentOrFaculty,
  async (req, res) => {
    try {
      const conversation = await ChatConversation.findById(req.params.id);
      if (!conversation)
        return res.status(404).json({ message: "Conversation not found" });
      if (!isParticipant(conversation, req.user._id)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const alreadyArchived = conversation.archivedBy.some(
        (id) => String(id) === String(req.user._id),
      );

      if (alreadyArchived) {
        conversation.archivedBy = conversation.archivedBy.filter(
          (id) => String(id) !== String(req.user._id),
        );
      } else {
        conversation.archivedBy.push(req.user._id);
      }

      await conversation.save();
      res.json({ archived: !alreadyArchived });
    } catch (error) {
      console.error("Failed to update archive state:", error);
      res.status(500).json({ message: "Failed to update archive state" });
    }
  },
);

module.exports = router;
