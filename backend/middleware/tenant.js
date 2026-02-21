const jwt = require("jsonwebtoken");
const { AsyncLocalStorage } = require("async_hooks");

// Per-request context to hold current user id
const als = new AsyncLocalStorage();

function getCurrentUserId() {
  const store = als.getStore();
  return store && store.userId ? store.userId : null;
}

// Express middleware: decode JWT if present and seed ALS with userId
function setUserContext(req, res, next) {
  const authHeader = req.header("Authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  let userId = null;
  if (token && token.toLowerCase() !== "null" && token.toLowerCase() !== "undefined") {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
      // Support tokens that store id either at decoded.id or decoded._id
      userId = decoded.id || decoded._id || null;
    } catch (_) {
      // Invalid token; proceed without user context (public routes)
    }
  }

  als.run({ userId }, () => next());
}

// Global mongoose plugin for tenant isolation via ownerId
function initTenantPlugin(mongoose) {
  mongoose.plugin((schema) => {
    // Allow schemas to opt-out of tenant scoping
    if (schema.get && schema.get("tenantSkip") === true) {
      return; // Do not apply tenant behavior to this schema
    }
    // Add ownerId to all schemas if not present
    if (!schema.path("ownerId")) {
      schema.add({
        ownerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          index: true,
        },
      });
    }

    // Automatically stamp ownerId on save if missing
    schema.pre("save", function (next) {
      const userId = getCurrentUserId();
      if (userId && !this.ownerId) {
        this.ownerId = userId;
      }
      next();
    });

    // Handle insertMany
    schema.pre("insertMany", function (next, docs) {
      const userId = getCurrentUserId();
      if (userId && Array.isArray(docs)) {
        docs.forEach((doc) => {
          if (doc && !doc.ownerId) doc.ownerId = userId;
        });
      }
      next();
    });

    function applyTenantFilter(query) {
      // Allow opt-out for specific administrative cases if explicitly set
      const opts = query.getOptions?.() || {};
      if (opts.__skipTenant === true) return;

      const userId = getCurrentUserId();
      if (!userId) return; // Public route or unauthenticated context

      // Merge existing filter with ownerId requirement
      query.where({ ownerId: userId });
    }

    const queryOps = [
      "find",
      "findOne",
      "count",
      "countDocuments",
      "findOneAndUpdate",
      "update",
      "updateOne",
      "updateMany",
      "deleteOne",
      "deleteMany",
    ];

    queryOps.forEach((op) => {
      schema.pre(op, function () {
        applyTenantFilter(this);
      });
    });

    // Aggregate pipeline scoping
    schema.pre("aggregate", function () {
      const userId = getCurrentUserId();
      const opts = this.options || {};
      if (opts.__skipTenant === true || !userId) return;

      const pipeline = this.pipeline();
      // Insert match at the beginning to scope to ownerId
      pipeline.unshift({ $match: { ownerId: mongoose.Types.ObjectId(userId) } });
    });
  });
}

module.exports = {
  initTenantPlugin,
  setUserContext,
  getCurrentUserId,
};
