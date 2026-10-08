# Study workflow

## Review milestones

Complete an initial study session, followed by reviews after 1, 3, 7, 14, 30, and 60 days. The last review completes the mastery milestone. Each gap starts from the previous credited completion. Extra practice before a due day is logged but does not skip intervals. Schedule credit uses UTC calendar days; date-only calendar fields retain the same displayed day across timezones.

Memory shows only the remaining dates up to the final review. Future dates assume timely completions and shift when a review is completed late. Mastery prompts you to choose **Keep studying** or **Finish for now**. Keep studying enables optional reviews every 60 days; Finish for now pauses suggestions. You can change this choice in Memory. Mastery does not guarantee permanent memory, and the forgetting curve is an illustration rather than a measured retention score.

Repeated completion requests do not advance the schedule again. Completed sessions cannot be reopened or moved to another topic. Delete an incorrect completion to rebuild the schedule from the remaining history. Deleting a subject or topic is blocked if it has related records. Archive a subject or mark a topic done to preserve history.

## JSON import

Open **Library → Choose JSON**, select a file, check the preview, then choose **Import subjects**. **Example JSON** downloads a template; a copy also lives in `seed/subjects.example.json`.

```json
{
  "subjects": [
    {
      "name": "Mathematics",
      "type": "academic",
      "color": "#F97316",
      "topics": ["Algebra", { "name": "Calculus" }]
    }
  ]
}
```

The UI also accepts a top-level array of subjects. Subject types are academic (default), hobby, or project. Optional colors use #RRGGBB. Ownership IDs, review history, unknown fields, duplicate subject names within the same type, and duplicate topic names within a subject are rejected. Limits: 1 MB, 50 subjects, 200 topics per subject, 2000 topics total. Matching existing subjects are skipped, including their nested topics. Imports are batched; a failed import rolls back only the documents created by that import.

Authenticated API: `POST /subjects/import`, body `{ "subjects": [...] }`.

## To-do list

Open **To-do** in the navigation. Create, edit, complete, reopen, or delete tasks; set low/normal/high priority and an optional due date. Active, completed, and all filters are available. Tasks are saved in MongoDB and scoped to your account.

Authenticated API: `GET/POST /todos`, `PATCH/DELETE /todos/:id`. Fields: title, priority, dueDate, completed.

## Pomodoro

Choose **Start studying** on a planned session in Sessions or Timeline. The floating Pomodoro survives navigation and refresh. Navigation also has a standalone **Pomodoro** button. Focus periods alternate with short breaks; every configured number of focus rounds uses a long break. Breaks do not mark the session completed. Choose **Finish session** when you are done; failed saves remain retryable.

Pause to customize focus duration (1–180 minutes), short break (1–60), long break (1–120), and rounds before a long break (1–12). Optional auto-start controls whether subsequent phases start automatically. Settings and active timer state are stored per account in this browser. Countdown uses elapsed wall-clock time rather than counting interval ticks.

## Efficiency and checks

Pages load on demand. API reads share in-flight requests and a 30-second cache, scoped to the current token; mutations invalidate it and refresh visible data. Account changes clear stored client data. List queries use lean documents and only populate needed subject/topic fields. Compound indexes support session history, due reviews, user lists, and task lists. A partial unique index prevents duplicate planned sessions for the same topic and UTC day.

`npm test` runs domain and HTTP/service regression tests. Database calls in HTTP/service tests are stubbed; these tests do not connect to or modify your configured database. `cd frontend && npm run lint` and `npm run build` check the frontend. Topic mutations serialize within one API process; deploying multiple API workers would require a database transaction or distributed coordination for session-history recomputation and import deduplication.
