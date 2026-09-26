// full_test.js — Comprehensive backend test suite
// Tests every route and every major error condition.

const BASE = "http://localhost:5000/api";
const IDEA = "A task management app for remote software development teams";

let passed = 0;
let failed = 0;
let planId = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

async function post(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await r.json() };
}

async function get(path) {
  const r = await fetch(BASE + path);
  return { status: r.status, data: await r.json() };
}

function section(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(60)}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function run() {
  // ── 0. Health check ──────────────────────────────────────────────────────
  section("0. Health Check — GET /");
  const health = await fetch("http://localhost:5000/");
  const healthData = await health.json();
  assert("Status 200", health.status === 200);
  assert("Returns message field", !!healthData.message);

  // ── 1. generate-requirements (validation) ────────────────────────────────
  section("1. POST /api/generate-requirements — Validation");

  const noBody = await post("/generate-requirements", {});
  assert("Missing idea → 400", noBody.status === 400);
  assert("400 has success:false", noBody.data.success === false);
  assert("400 has message", typeof noBody.data.message === "string");

  const emptyIdea = await post("/generate-requirements", { idea: "   " });
  assert("Empty/whitespace idea → 400", emptyIdea.status === 400);

  // ── 2. generate-requirements (happy path) ────────────────────────────────
  section("2. POST /api/generate-requirements — Happy Path");

  const r1 = await post("/generate-requirements", { idea: IDEA });
  assert("Status 201", r1.status === 201);
  assert("success: true", r1.data.success === true);
  assert("Has _id", !!r1.data.data?._id);
  assert("Has idea field", r1.data.data?.idea === IDEA);
  assert("Has requirements object", !!r1.data.data?.requirements);
  assert(
    "features is array",
    Array.isArray(r1.data.data?.requirements?.features)
  );
  assert(
    "userStories is array",
    Array.isArray(r1.data.data?.requirements?.userStories)
  );
  assert(
    "features count 5–10",
    r1.data.data?.requirements?.features?.length >= 5 &&
      r1.data.data?.requirements?.features?.length <= 10
  );
  assert(
    "userStories count 5–10",
    r1.data.data?.requirements?.userStories?.length >= 5 &&
      r1.data.data?.requirements?.userStories?.length <= 10
  );
  assert("Has createdAt", !!r1.data.data?.createdAt);
  assert("schema is null (not generated yet)", r1.data.data?.schema == null);
  assert("apis is null (not generated yet)", r1.data.data?.apis == null);
  assert(
    "sprintPlan is null (not generated yet)",
    r1.data.data?.sprintPlan == null
  );

  planId = r1.data.data?._id;
  console.log(`  📌 planId captured: ${planId}`);

  // ── 3. generate-schema (validation) ─────────────────────────────────────
  section("3. POST /api/generate-schema — Validation");
  const sv = await post("/generate-schema", {});
  assert("Missing idea → 400", sv.status === 400);
  assert("400 success:false", sv.data.success === false);

  // ── 4. generate-schema (happy path) ─────────────────────────────────────
  section("4. POST /api/generate-schema — Happy Path (update existing doc)");
  const r2 = await post("/generate-schema", { idea: IDEA, planId });
  assert("Status 200 (updated, not created)", r2.status === 200);
  assert("success: true", r2.data.success === true);
  assert("Same _id as step 2", r2.data.data?._id === planId);
  assert("Has schema.tables array", Array.isArray(r2.data.data?.schema?.tables));
  assert(
    "tables count 3–8",
    r2.data.data?.schema?.tables?.length >= 3 &&
      r2.data.data?.schema?.tables?.length <= 8
  );
  assert(
    "First table has tableName",
    !!r2.data.data?.schema?.tables?.[0]?.tableName
  );
  assert(
    "First table has fields array",
    Array.isArray(r2.data.data?.schema?.tables?.[0]?.fields)
  );
  assert(
    "Fields have name+type+description",
    r2.data.data?.schema?.tables?.[0]?.fields?.[0]?.name &&
      r2.data.data?.schema?.tables?.[0]?.fields?.[0]?.type
  );
  assert("requirements still populated", !!r2.data.data?.requirements);

  // ── 5. generate-apis (validation) ───────────────────────────────────────
  section("5. POST /api/generate-apis — Validation");
  const av = await post("/generate-apis", { idea: "" });
  assert("Empty idea → 400", av.status === 400);

  // ── 6. generate-apis (happy path) ───────────────────────────────────────
  section("6. POST /api/generate-apis — Happy Path (update existing doc)");
  const r3 = await post("/generate-apis", { idea: IDEA, planId });
  assert("Status 200", r3.status === 200);
  assert("success: true", r3.data.success === true);
  assert("Same _id", r3.data.data?._id === planId);
  assert(
    "Has apis.endpoints array",
    Array.isArray(r3.data.data?.apis?.endpoints)
  );
  assert(
    "endpoints count 8–15",
    r3.data.data?.apis?.endpoints?.length >= 8 &&
      r3.data.data?.apis?.endpoints?.length <= 15
  );
  assert(
    "Endpoint has method",
    !!r3.data.data?.apis?.endpoints?.[0]?.method
  );
  assert(
    "Endpoint has endpoint path",
    !!r3.data.data?.apis?.endpoints?.[0]?.endpoint
  );
  assert(
    "Endpoint has description",
    !!r3.data.data?.apis?.endpoints?.[0]?.description
  );
  assert(
    "Valid HTTP method",
    ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(
      r3.data.data?.apis?.endpoints?.[0]?.method
    )
  );
  assert("schema still populated", !!r3.data.data?.schema);
  assert("requirements still populated", !!r3.data.data?.requirements);

  // ── 7. generate-sprint-plan (validation) ────────────────────────────────
  section("7. POST /api/generate-sprint-plan — Validation");
  const spv = await post("/generate-sprint-plan", {});
  assert("Missing idea → 400", spv.status === 400);

  // ── 8. generate-sprint-plan (happy path) ────────────────────────────────
  section("8. POST /api/generate-sprint-plan — Happy Path (update existing doc)");
  const r4 = await post("/generate-sprint-plan", { idea: IDEA, planId });
  assert("Status 200", r4.status === 200);
  assert("success: true", r4.data.success === true);
  assert("Same _id", r4.data.data?._id === planId);
  assert(
    "Has sprintPlan.sprints array",
    Array.isArray(r4.data.data?.sprintPlan?.sprints)
  );
  assert(
    "sprints count 3–6",
    r4.data.data?.sprintPlan?.sprints?.length >= 3 &&
      r4.data.data?.sprintPlan?.sprints?.length <= 6
  );
  assert(
    "Sprint has sprintName",
    !!r4.data.data?.sprintPlan?.sprints?.[0]?.sprintName
  );
  assert(
    "Sprint has duration",
    !!r4.data.data?.sprintPlan?.sprints?.[0]?.duration
  );
  assert(
    "Sprint has tasks array",
    Array.isArray(r4.data.data?.sprintPlan?.sprints?.[0]?.tasks)
  );
  assert(
    "tasks count 3–8",
    r4.data.data?.sprintPlan?.sprints?.[0]?.tasks?.length >= 3 &&
      r4.data.data?.sprintPlan?.sprints?.[0]?.tasks?.length <= 8
  );
  // Verify ALL 4 fields now populated on the same document
  assert("requirements populated", !!r4.data.data?.requirements);
  assert("schema populated", !!r4.data.data?.schema);
  assert("apis populated", !!r4.data.data?.apis);
  assert("sprintPlan populated", !!r4.data.data?.sprintPlan);

  // ── 9. GET /api/plans ───────────────────────────────────────────────────
  section("9. GET /api/plans — All Plans");
  const r5 = await get("/plans");
  assert("Status 200", r5.status === 200);
  assert("success: true", r5.data.success === true);
  assert("Has count field", typeof r5.data.count === "number");
  assert("count >= 1", r5.data.count >= 1);
  assert("data is array", Array.isArray(r5.data.data));
  assert("Newest first (createdAt sorted)", () => {
    if (r5.data.data.length < 2) return true;
    return new Date(r5.data.data[0].createdAt) >= new Date(r5.data.data[1].createdAt);
  });
  assert("No __v field exposed", r5.data.data?.[0]?.__v === undefined);

  // ── 10. GET /api/plans/:id (happy path) ─────────────────────────────────
  section("10. GET /api/plans/:id — Fetch Single Plan");
  const r6 = await get("/plans/" + planId);
  assert("Status 200", r6.status === 200);
  assert("success: true", r6.data.success === true);
  assert("Correct _id returned", r6.data.data?._id === planId);
  assert("idea matches", r6.data.data?.idea === IDEA);
  assert("requirements populated", !!r6.data.data?.requirements);
  assert("schema populated", !!r6.data.data?.schema);
  assert("apis populated", !!r6.data.data?.apis);
  assert("sprintPlan populated", !!r6.data.data?.sprintPlan);
  assert("No __v field exposed", r6.data.data?.__v === undefined);

  // ── 11. GET /api/plans/:id (error cases) ─────────────────────────────────
  section("11. GET /api/plans/:id — Error Cases");
  const notFound = await get("/plans/000000000000000000000000");
  assert("Valid ObjectId but missing doc → 404", notFound.status === 404);
  assert("404 success:false", notFound.data.success === false);

  const badId = await get("/plans/not-a-valid-id");
  assert("Invalid ObjectId format → 400", badId.status === 400);
  assert("400 success:false", badId.data.success === false);

  // ── 12. update-or-create: no planId creates NEW doc ──────────────────────
  section("12. generate-schema without planId → creates NEW doc");
  const r7 = await post("/generate-schema", { idea: "A simple blog platform" });
  assert("Status 201 (new doc created)", r7.status === 201);
  assert("New _id (different from planId)", r7.data.data?._id !== planId);
  assert("Has schema", !!r7.data.data?.schema);
  assert("requirements is null (not generated)", r7.data.data?.requirements == null);

  // ── 13. planId not found ─────────────────────────────────────────────────
  section("13. generate-requirements with invalid planId → 404");
  const r8 = await post("/generate-requirements", {
    idea: IDEA,
    planId: "000000000000000000000000",
  });
  assert("Status 404", r8.status === 404);
  assert("success:false", r8.data.success === false);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  RESULTS: ${passed} passed   ${failed} failed   ${passed + failed} total`);
  console.log(`${"═".repeat(60)}\n`);
  if (failed === 0) {
    console.log("  🎉  ALL TESTS PASSED — Backend is fully working!\n");
  } else {
    console.log("  ⚠️  Some tests failed — see ❌ above for details.\n");
  }
}

run().catch((e) => console.error("FATAL:", e));
