AI Mystery Room --- Product & Technical Specification
Document: SPEC.md
Project type: AI-powered, full-stack mystery investigation game
Status: Implementation blueprint
Deadline: 2 November 2026, 11:59 PM
Required stack: React, Vite, Tailwind CSS, Node.js, Express,
MongoDB, Mongoose, Gemini API, Zod
1. Executive Summary
AI Mystery Room is a web application in which a player supplies a short
premise and chooses a difficulty level. The application creates a
complete fictional investigation containing a case narrative, suspects,
clues, and AI-generated evidence artifacts. The player examines the
evidence, requests limited hints, identifies a culprit, and receives a
verdict with an evidence-based explanation and score.

Foundational architecture rule: there must be exactly one
authoritative source of truth for each case. All story facts,
characters, motives, timeline events, suspect alibis, clues, evidence
artifacts, contradictions, hints, the intended culprit, and the final
explanation must derive from one canonical case model. The system must
not independently invent conflicting versions of the case when
generating individual assets.

Evidence may include images, video/CCTV clips, audio or voice
recordings, fictional WhatsApp-style conversations, documents,
photographs, and other artifacts. These are fictional, AI-generated or
AI-composed assets created specifically for the case. They must be
traceable to the canonical case model and validated against it. Where a
media-generation provider is unavailable, the system may create a
clearly identified simulated artifact (for example, a designed CCTV
transcript or audio transcript) rather than pretending an actual
recording was generated.
2. Problem Statement and Goals
2.1 Problem
Many AI mystery experiences generate a story and then create loosely
related clues. This can make the mystery unfair or impossible to solve.
AI Mystery Room must produce an immersive investigation where all
evidence belongs to one coherent case and the final solution is
supported by the evidence available to the player.
2.2 Goals
- Generate playable mysteries at Easy, Medium, and Hard difficulty.
- Maintain one canonical, server-side source of truth for each case.
- Generate a coherent cast, timeline, motives, alibis, solution,
  clues, hints, and evidence artifacts.
- Support multiple media types: images, video, audio, chat messages,
  and text/document evidence.
- Make evidence discoverable through a clear investigation interface.
- Keep the culprit and solution private until the player submits an
  accusation.
- Enforce clue discovery, hint limits, accusations, and scoring on the
  backend.
- Persist cases and player progress in MongoDB.
- Deliver a responsive, deployed website and a complete GitHub
  repository.
2.3 Non-goals for the first release
- Real-world investigations or claims about real people.
- Uploading or analyzing evidence supplied by the player.
- Multiplayer or live collaborative investigations.
- Mandatory user accounts, social features, leaderboards, or payments.
- Unlimited free-form AI chat with suspects.
- Generating lengthy, high-resolution videos or unrestricted audio on
  every request.
- Guaranteeing that every media asset is a real video/audio file if
  the configured provider does not support that modality.
Optional features must not delay the required gameplay, evidence
consistency, security, or deployment.
3. Target Users and Experience
Target users are students, casual gamers, and people who enjoy detective
stories, puzzles, and interactive investigations.

The experience should feel like a fictional detective case file. Players
should be able to inspect evidence, understand where it came from,
distinguish confirmed facts from witness claims, and make a reasoned
accusation.

The interface must never require the player to understand the underlying
AI or database. Loading states should explain what is being prepared,
and errors should offer a clear next action.
4. Technology Stack
Frontend
- React with Vite.
- Tailwind CSS for styling.
- React Router for navigation.
- Axios for API communication.
- Accessible reusable components for evidence viewers, suspect cards,
  clue lists, and dialogs.
Backend
- Node.js and Express.
- Mongoose for MongoDB persistence.
- @google/genai for Gemini integration.
- Zod for request and generated-output validation.
- dotenv for local environment variables.
- cors with an explicit frontend allowlist.
- express-rate-limit or an equivalent limiter for expensive public
  endpoints.
- A structured logger that redacts secrets and private solution
  fields.
Storage and deployment
- MongoDB Atlas for canonical cases and player progress.
- Vercel for the React frontend.
- A Node-compatible hosting provider for the Express API.
- An object-storage provider, if needed, for generated media. Store
  media metadata and URLs in MongoDB, not large binary files.
- GitHub for version control and submission.
The chosen Gemini model and any image/video/audio generation provider
must be configurable. Do not assume that a text-generation model can
create binary images, video, or audio. Use modality-appropriate
providers only where available and configured.
5. Core Architectural Principle: One Source of Truth
5.1 Canonical case model
The backend must create and persist one authoritative canonicalCase
for each investigation. It contains the fixed facts from which all
public and private case material is derived:
- Case premise and core incident.
- Actual culprit and their motive.
- Complete event timeline with timestamps and locations.
- Suspect identities, relationships, motives, knowledge, and actions.
- Each suspect's actual movements and claimed alibi.
- Relevant objects, locations, access rules, and physical constraints.
- The sequence of events before, during, and after the incident.
- The actual explanation of what happened.
- The facts each clue is intended to establish or challenge.
- A solution proof: a step-by-step chain explaining why the intended
  culprit fits and alternatives do not.
- The difficulty-specific suspect, clue, and hint requirements.
The canonical case is the sole authority for game logic. Public story
text, evidence descriptions, images, videos, audio, chat logs, hints,
and final explanation are derived artifacts---not independent sources of
truth.
5.2 Generation pipeline
Use a staged server-side pipeline:
1. Normalize input: Trim and validate the premise and difficulty.
2. Generate the canonical case: Ask Gemini for structured case
   facts, timeline, culprit, motives, suspects, and solution proof.
3. Validate canonical facts: Parse with Zod and run semantic
   consistency checks.
4. Generate an evidence plan: Create an explicit evidence manifest
   mapping every planned artifact to canonical facts, timestamps,
   people, locations, and intended deductions.
5. Generate artifacts: Create text, fictional chat messages,
   documents, images, and---where supported---video/audio assets from
   the evidence manifest.
6. Validate artifact consistency: Check names, timestamps,
   locations, visible details, and claims against canonical facts.
   Retry or regenerate failed artifacts within a bounded retry budget.
7. Run a case quality check: Confirm the solution is supported, the
   required counts are correct, clues are discoverable, and no
   accidental solution leak appears in player-facing content.
8. Persist atomically: Save the validated case and its evidence
   manifest before making the case playable.
9. Create a public response: Return only fields allowed for the
   current game state.
Do not let a later artifact-generation prompt freely change the culprit,
timeline, suspect identities, or established facts. Pass the relevant
canonical facts and a narrow artifact brief into each generation call.
If an artifact contradicts the canonical model, regenerate or mark that
artifact unavailable; do not rewrite the source of truth to fit it.
5.3 Evidence provenance and traceability
Every artifact must have: - A stable artifact ID. - A media type and
display title. - A reference to one or more canonical timeline events or
facts. - A short internal explanation of what the artifact supports or
contradicts. - A generation status. - A player-facing description that
does not reveal the solution. - A storage reference if it is a binary
asset.

Evidence may be ambiguous, misleading, forged within the fictional
story, or based on a witness's mistaken belief. If so, that status and
explanation must be explicitly represented in the canonical model. A
character's lie is allowed; an accidental contradiction introduced by
separate AI generations is not.
5.4 Images, video, audio, and chat messages
- Images: Generate or compose fictional scene photographs, object
  photos, screenshots, or other evidence from a precise artifact
  brief. Maintain consistent characters, clothing, locations, and
  relevant object details wherever feasible.
- Video/CCTV: If true video generation is configured, create short
  clips based on a defined time, location, and event. Otherwise use a
  clearly labeled simulated CCTV clip, storyboard, keyframes, or
  transcript. Do not label a transcript as an actual video.
- Audio/voice recordings: If audio generation is configured,
  create a fictional recording based on canonical dialogue and event
  timing. If only a transcript is available, identify it as a
  transcript. Do not claim that real audio exists when it does not.
- WhatsApp-style messages: Generate fictional chat content,
  participants, timestamps, and delivery order from the canonical
  timeline. Use a clearly fictional in-app chat presentation; do not
  imply that messages came from real WhatsApp accounts.
- Documents and reports: Create fictional documents whose contents
  match the case facts and identify them as in-world artifacts.
- Asset failure: If a provider fails, use a clearly marked
  fallback representation or omit the optional modality without
  breaking the case. Never invent a working media URL or show a broken
  media player as if the asset exists.
AI-generated artifacts should be identified as fictional in appropriate
product/help copy. Do not use real people's likenesses or voices without
authorization; prefer fictional identities and generated characters.
6. Difficulty Rules
These counts are mandatory.

  Requirement                            Easy   Medium   Hard
  Suspects                                  3        4      5
Clues                                     5        7      9
Hints                                     2        3      3
Base points for correct accusation      100      150    200

The number of clues refers to distinct discoverable clue records, not
the number of media files. A clue may be supported by one or more
artifacts. The UI may show several artifacts that contribute to one
clue, but each clue ID may award points only once.

Difficulty should affect the number of suspects, clue complexity, red
herrings, and how directly the evidence points to the answer. It must
not make the solution arbitrary or unsupported.
7. AI Output Contracts
Use JSON structured output where supported, followed by Zod validation.
Treat all model output as untrusted until parsed and checked.
7.1 Canonical case (private)
Recommended fields:
- caseId
- title
- premise
- difficulty
- incident
- timeline[]
- suspects[]
- facts[]
- solution
- solutionProof[]
- cluePlan[]
- hintPlan[]
- evidenceManifest[]
- qualityChecks
Each timeline event should include an ID, timestamp with timezone or a
clearly defined local timeline, location, participants, event
description, and related fact IDs.

Each suspect should include a stable ID, fictional name, public
description, public alibi, private actual actions, motive, relevant
knowledge, and relationships. Separate public and private fields at the
schema level or in serialization logic.

The private solution should include culpritSuspectId, motive, method,
timeline explanation, supporting fact IDs, and why competing suspects
are not the culprit.
7.2 Public case (client-safe)
The frontend may receive: - Case ID, title, premise, story, and
difficulty. - Public suspect cards and their alibis. - Public evidence
catalog with undiscovered artifacts represented without hidden
content. - Already discovered clues and artifacts. - Remaining hint
count, discovered clue count, progress, and current score estimate if
provided. - Current game status.

The frontend must not receive: - Culprit ID. - Solution or solution
proof. - Private actual movements, hidden motives, or secret facts. -
Unrevealed clue contents. - Undelivered hints. - Internal generation
prompts or provider secrets.

Never serialize a full Mongoose document directly to the client.
7.3 Validation and repair
Validate: - Required fields and types. - Exact suspect, clue, and hint
counts for the selected difficulty. - Unique IDs. - All referenced IDs
exist. - Timestamps and event ordering are coherent. - Evidence artifact
references point to valid facts/events. - The solution proof references
available clues/facts. - No empty or duplicate clues. - The intended
culprit is a valid suspect. - The explanation does not depend on facts
that the player cannot discover. - Player-facing text does not reveal
the culprit prematurely.

Use a bounded retry strategy. If a case cannot pass validation, return a
controlled generation failure and do not save it as playable.
8. User Flow and Pages
8.1 Home page
- Product name and concise explanation.
- Start Investigation button.
- Brief explanation of the case-solving loop.
- Fictional-content disclosure.
- Responsive layout.
8.2 Create Mystery page
- Premise input with minimum/maximum length.
- Difficulty selector.
- Optional example premises.
- Generate button and loading state.
- Validation messages and retry option.
- Prevent duplicate submissions while generation is running.
8.3 Investigation Room
- Case title, story, difficulty, and progress.
- Suspect cards with public profiles and alibis.
- Evidence board/library grouped by type: images, CCTV/video,
  audio/recordings, chats, documents, and other artifacts.
- Evidence viewer appropriate to the type.
- Discover clue action and clear discovered state.
- Hint action with remaining hint count and confirmation or clear cost
  disclosure.
- A visible distinction between undiscovered evidence and discovered
  evidence.
- No culprit, solution proof, hidden clue text, or private generation
  data.
- Responsive layout and keyboard-accessible controls.
Only evidence that is discovered or otherwise explicitly made available
by the game rules should be sent to the client. Do not send hidden
evidence payloads and merely hide them with CSS.
8.4 Accusation page/modal
- Select one suspect.
- Optional player reasoning field, if implemented.
- Explain that submitting locks the investigation.
- Confirm submission.
- Disable repeated submissions while a request is pending.
- Backend performs the authoritative evaluation.
8.5 Results page
Only accessible after the accusation has been accepted and the case
marked completed.

Display: - Correct/incorrect verdict. - Player's accusation. - Culprit's
identity. - Final explanation. - Evidence-based solution walkthrough. -
Final score and score breakdown. - Replay/start-new-case action.

The results API must enforce completion status; changing the URL
manually must not reveal an active case's solution.
9. Scoring Rules
Scoring is authoritative on the backend.

finalScore = max(0, baseScore + (uniqueDiscoveredClues × 5) - (successfullyDeliveredHints × 10))

Base score is awarded only for a correct accusation: - Easy: 100 -
Medium: 150 - Hard: 200

For an incorrect accusation, base score is zero. Clue points and hint
penalties still apply.

Rules: - A clue awards +5 only on the first successful discovery of that
clue ID. - A hint incurs −10 only when the server successfully delivers
a hint. - Hint use cannot exceed the case's configured hint count. -
Repeated API requests must not award duplicate clue points or duplicate
hint penalties. - Score cannot be below zero. - The server stores the
final score and score breakdown when the accusation is finalized. - A
completed case cannot be accused again or have its score recalculated by
a duplicate request.

The UI may display an estimate, but the result returned by the backend
is authoritative.
10. Database Design
Use Mongoose schemas with validation, timestamps, and explicit
public/private serialization.
10.1 Case model
Suggested fields: - title, premise, difficulty, story -
canonicalCase --- private validated source of truth - suspects ---
public and private fields separated - clues --- clue metadata, linked
artifact IDs, discovery state - hints --- hint text and delivery/use
state - evidenceManifest --- type, provenance references, generation
state, storage metadata - playerProgress --- discovered clue IDs,
delivered hint IDs/count, current status - accusation --- selected
suspect ID and submission timestamp - result --- private verdict and
score breakdown, returned only after completion - status ---
generating, active, completed, or failed - generationStatus
and bounded retry metadata - createdAt, updatedAt, completedAt

If the application later supports multiple players per case, separate
shared case content from player-session progress. For the first release,
each case ID can represent one independent player session.
10.2 Media storage
Do not store large binary media files directly in MongoDB. Store them in
object storage and keep: - Provider/storage key. - MIME type. - Size and
duration when applicable. - Generation status. - Artifact ID and
canonical fact/event references. - Access policy or signed URL metadata.

Do not expose private storage keys or permanent public links to
unrevealed evidence. Use server-controlled delivery or short-lived
signed URLs where appropriate.
11. REST API Contract
Prefix routes with /api.
GET /api/health
Returns service health without leaking environment values.
POST /api/cases
Request:
{
  "premise": "A priceless necklace disappears during a private gala.",
  "difficulty": "medium"
}
Behavior: - Validate input. - Generate and validate the canonical
case. - Generate/validate the evidence manifest and configured assets. -
Persist a playable case only after required checks pass. - Return a
client-safe case summary and case ID.

Response example:
{
  "case": {
    "id": "case_id",
    "title": "The Vanishing Necklace",
    "difficulty": "medium",
    "status": "active"
  }
}
Never include the private canonical solution in this response.
GET /api/cases/:id
Returns the active case's public narrative, suspect cards, permitted
evidence catalog, and progress. Hidden artifact content and private
solution fields must be omitted.
POST /api/cases/:id/clues/:clueId/discover
Behavior: - Validate case and clue IDs. - Verify case is active and clue
belongs to the case. - Verify the clue is available to discover. - Mark
it discovered idempotently. - Return the newly revealed clue/artifacts
and updated progress. - Award points only once per unique clue.
POST /api/cases/:id/hints
Request may include a permitted hint tier or omit it to request the next
hint.

Behavior: - Verify active case and remaining hint availability. - Select
a pre-generated hint from the canonical hint plan. - Return the hint and
record delivery atomically. - Apply the penalty only once per
successfully delivered hint. - Never ask Gemini to improvise a new hint
that might reveal inconsistent facts during gameplay.
POST /api/cases/:id/accuse
Request:
{
  "suspectId": "suspect_2"
}
Behavior: - Validate suspect ID and case status. - Ensure the suspect
belongs to the case. - Lock or atomically transition the case so only
one accusation is accepted. - Compare the accusation with the private
culprit ID on the server. - Calculate and persist the score exactly
once. - Mark the case completed. - Return the verdict and authorized
result summary.
GET /api/cases/:id/result
- Reject if the case is not completed.
- Return culprit, explanation, solution walkthrough, verdict, and
  persisted score after completion.
- Do not trust a client-supplied completion flag.
API error format
Use a consistent response:
{
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "This case could not be found."
  }
}
Use appropriate status codes: 400 invalid input, 404 missing
case/resource, 409 invalid state or repeated conflicting action, 429
rate limit, and 500 unexpected server error. Avoid returning stack
traces, prompts, secrets, database internals, or the solution in errors.
12. Backend Modules
Suggested organization:
server/src/
  app.js
  server.js
  config/
    database.js
    env.js
  models/
    Case.js
  routes/
    health.routes.js
    cases.routes.js
  controllers/
    cases.controller.js
  services/
    gemini.service.js
    case-generation.service.js
    evidence-generation.service.js
    scoring.service.js
    media-storage.service.js
  validators/
    case.schemas.js
    request.schemas.js
  middleware/
    error-handler.js
    rate-limit.js
    validate-request.js
    not-found.js
  utils/
    public-case.js
    ids.js
Keep business logic out of route handlers. Use a single scoring service
and a single public-case serializer to prevent inconsistent rules or
accidental leakage.
13. Frontend Structure
Suggested organization:
client/src/
  components/
    layout/
    evidence/
    suspects/
    clues/
    hints/
    common/
  pages/
    Home.jsx
    CreateMystery.jsx
    InvestigationRoom.jsx
    Results.jsx
    NotFound.jsx
  services/
    api.js
    cases.api.js
  hooks/
  context/
  App.jsx
  main.jsx
Use React Router for navigation and Axios for requests. Keep the UI
state synchronized with server responses; never treat client state as
authoritative for scoring, discovered clues, hint counts, or case
completion.

Provide loading, empty, error, retry, and disabled states. Use
accessible labels, visible focus indicators, adequate contrast, keyboard
navigation, and responsive layouts.
14. Security, Privacy, and Abuse Prevention
- Keep Gemini API keys and database credentials on the backend.
- Keep .env files out of version control; commit .env.example with
  placeholders only.
- Validate and limit premise length and all request payloads.
- Apply rate limiting to case generation and hint requests.
- Configure CORS for known frontend origins.
- Do not expose the canonical case, solution, private suspect fields,
  hidden evidence contents, or prompts in public endpoints or logs.
- Use allowlisted serializers instead of returning raw database
  documents.
- Make clue discovery and hint delivery idempotent.
- Use atomic updates/transactions where needed to prevent duplicate
  scoring and race conditions.
- Restrict media access to artifacts the player is allowed to view.
- Sanitize rendered text and do not render AI output as trusted HTML.
- Treat the user's premise as untrusted input. Do not allow it to
  override system rules, scoring, privacy, or output schema.
- Do not let AI output choose executable code, filesystem paths,
  database queries, or arbitrary URLs.
- Identify the game and all evidence as fictional/AI-generated where
  appropriate.
- Do not create realistic evidence intended to impersonate real people
  or mislead others outside the fictional game.
- Never log API keys, raw connection strings, or private solution
  data.
For the initial release, case IDs should be unguessable. If anonymous
users can access cases by ID, document that possession of the ID grants
access to that case and apply rate limits. Do not claim user
authentication or ownership checks exist unless implemented.
15. Error Handling and Resilience
Handle at least: - Empty or excessively long premise. - Unsupported
difficulty. - Gemini timeout, quota, or service failure. - Invalid or
inconsistent model output. - Evidence-generation provider unavailable. -
Partial media generation failure. - MongoDB connection or persistence
failure. - Unknown case, suspect, clue, or artifact ID. - Attempt to
discover an already discovered clue. - Attempt to exceed the hint
limit. - Attempt to accuse after completion. - Result request before
completion. - Expired or inaccessible media URL. - Network failure in
the frontend.

A failed optional media asset should not invalidate otherwise sound case
logic if the artifact can be safely represented by a truthful fallback.
A failed required artifact or invalid solution must prevent the case
from becoming playable.
16. Testing Strategy
Unit tests
- Scoring for each difficulty.
- Correct and incorrect accusation calculations.
- Score floor at zero.
- Unique clue awards and hint penalties.
- Zod schema validation.
- Public serializer omits all private fields.
- Evidence manifest references valid facts/events.
API/integration tests
- Generate valid Easy, Medium, and Hard cases.
- Reject malformed requests and malformed model output.
- Retrieve a case without exposing the solution.
- Discover clues and verify points are awarded once.
- Request hints and verify count/penalty.
- Accuse correctly and incorrectly.
- Reject duplicate accusations and completed-case mutations.
- Reject results before completion.
- Simulate Gemini and MongoDB failures.
End-to-end tests
Complete at least one full case on the deployed website: 1. Enter a
premise. 2. Generate a case. 3. Inspect suspects and evidence. 4.
Discover clues. 5. Request a hint. 6. Submit an accusation. 7. Review
the verdict and score. 8. Start another case.

Repeat core checks across all difficulty levels. Inspect actual API
responses to verify that the culprit and solution are not sent before
the accusation.
Consistency/quality checks
- All artifact names, timestamps, locations, and referenced people
  match the canonical case unless an intentional in-world discrepancy
  is specified.
- Every decisive conclusion is supported by discoverable evidence.
- The solution does not depend on inaccessible or undisclosed facts.
- Red herrings are explainable and do not make another suspect equally
  valid.
- Image/video/audio content, where generated, matches the artifact
  brief as far as the configured provider permits.
- Chat participants and timestamps follow the canonical timeline.
- Fallbacks are labeled honestly and do not pretend that nonexistent
  media was generated.
17. Acceptance Criteria
The project is complete when:
1. SPEC.md documents the architecture and behavior clearly enough for
   implementation.
2. The application generates Easy, Medium, and Hard cases with exact
   required suspect/clue/hint counts.
3. Each case has one authoritative canonical model and evidence
   manifest.
4. All evidence types derive from the canonical model and are checked
   for consistency.
5. Images, videos, recordings, chats, and documents are generated when
   supported, or represented by honest, clearly labeled fallbacks.
6. Players can inspect evidence, discover clues, request hints, and
   accuse a suspect.
7. The solution remains private until an accusation is accepted.
8. The backend calculates and persists scores correctly and only once.
9. Results show the correct verdict, culprit, explanation, and score
   breakdown.
10. Invalid AI output and service failures are handled safely.
11. The app is responsive and usable on desktop and mobile.
12. The production frontend, backend, database, and configured AI/media
    providers work together.
13. A complete case can be created and solved on the deployed website.
14. The GitHub repository contains the source code and setup
    instructions without secrets.
15. The submission includes the repository URL and live website URL.
18. Environment Variables
Backend .env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
Add media-provider keys and object-storage credentials only if those
providers are actually configured. Keep all secrets server-side.
Frontend .env
VITE_API_BASE_URL=http://localhost:5000/api
In production, set VITE_API_BASE_URL to the deployed backend API URL.
Vite variables prefixed with VITE_ are public and must never contain
secrets.
19. Development and Deployment Plan
Phase 1 --- Specification and setup
- Finalize this document.
- Create the client and server applications.
- Configure Tailwind CSS, routing, environment validation, and
  MongoDB.
- Establish Git and .gitignore.
Phase 2 --- Canonical case engine
- Define Zod schemas.
- Implement Gemini canonical-case generation.
- Validate timeline, suspects, facts, solution proof, and difficulty
  counts.
- Persist only validated cases.
Phase 3 --- Evidence pipeline
- Build the evidence manifest from canonical facts.
- Generate text artifacts and fictional chat logs.
- Add configured image/video/audio generation where feasible.
- Validate provenance and consistency.
- Add truthful fallback rendering for unsupported or failed
  modalities.
Phase 4 --- Gameplay APIs
- Implement case retrieval, clue discovery, hint delivery, accusation,
  results, and scoring.
- Add idempotency and private/public serializers.
- Test all backend rules.
Phase 5 --- Frontend
- Implement Home, Create Mystery, Investigation Room, Accusation, and
  Results.
- Add evidence viewers and progress indicators.
- Connect to APIs and implement error/loading states.
Phase 6 --- Verification and release
- Run unit, integration, and end-to-end tests.
- Configure MongoDB Atlas, backend hosting, and Vercel.
- Set production environment variables and CORS.
- Test the full production journey.
- Update README with setup and deployment instructions.
- Submit the GitHub repository and live URL before the deadline.
Prioritize a reliable complete game loop and a consistent evidence
system over optional polish. Real media generation can be expensive or
unavailable; select providers and limits early, and never compromise the
single-source-of-truth rule to simulate completeness.
20. Final Deliverables
- SPEC.md --- this specification.
- Complete React/Vite frontend.
- Complete Express/MongoDB backend.
- Gemini integration with validated structured output.
- Canonical case model and evidence manifest.
- Evidence artifacts and honest fallbacks for unsupported modalities.
- Scoring, clue discovery, hint, accusation, and results flows.
- .env.example files without real secrets.
- README.md with local setup, environment variables, testing, and
  deployment.
- GitHub repository URL.
- Live deployed website URL.
- Demonstration of creating and solving a mystery on the live site.
Non-negotiable implementation rule: There is one canonical case
source of truth. Every story detail, suspect action, clue, hint, image,
video, recording, chat message, and final explanation must derive from
it or explicitly represent a character's intentional lie, a forged
artifact, or an unreliable observation defined in that same source. No
independent generation step may silently alter the case facts or
solution.
