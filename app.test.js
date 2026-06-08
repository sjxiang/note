const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const NotesApp = require("./app.js");

function stateWithThreeNotes() {
  return NotesApp.createState(
    [
      NotesApp.createNote({
        id: "a",
        title: "工作",
        content: "整理会议记录",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      NotesApp.createNote({
        id: "b",
        title: "生活",
        content: "周末买咖啡豆",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
      NotesApp.createNote({
        id: "c",
        title: "读书",
        content: "摘录章节",
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z",
      }),
    ],
    "b",
  );
}

test("createState normalizes notes and selects the first available note", () => {
  const state = NotesApp.createState([
    { id: "one", title: "A", content: "B", createdAt: "2026-01-01T00:00:00.000Z" },
    null,
  ]);

  assert.equal(state.notes.length, 1);
  assert.equal(state.selectedId, "one");
  assert.equal(state.notes[0].updatedAt, "2026-01-01T00:00:00.000Z");
});

test("addNote creates and selects a new note while clearing search", () => {
  const state = NotesApp.setSearch(stateWithThreeNotes(), "咖啡");
  const next = NotesApp.addNote(state, {
    id: "new",
    title: "新笔记",
    now: "2026-01-04T00:00:00.000Z",
  });

  assert.equal(next.notes[0].id, "new");
  assert.equal(next.selectedId, "new");
  assert.equal(next.search, "");
});

test("updateSelectedNote edits only the selected note", () => {
  const state = stateWithThreeNotes();
  const next = NotesApp.updateSelectedNote(
    state,
    { title: "家庭", content: "更新内容" },
    { now: "2026-01-05T00:00:00.000Z" },
  );

  assert.equal(NotesApp.getSelectedNote(next).title, "家庭");
  assert.equal(NotesApp.getSelectedNote(next).content, "更新内容");
  assert.equal(NotesApp.getSelectedNote(next).updatedAt, "2026-01-05T00:00:00.000Z");
  assert.equal(next.notes.find((note) => note.id === "a").title, "工作");
});

test("deleteSelectedNote removes the current note and selects the next note", () => {
  const state = stateWithThreeNotes();
  const next = NotesApp.deleteSelectedNote(state);

  assert.deepEqual(
    next.notes.map((note) => note.id),
    ["a", "c"],
  );
  assert.equal(next.selectedId, "c");
});

test("deleteSelectedNote selects the previous note when deleting the last note", () => {
  const state = NotesApp.selectNote(stateWithThreeNotes(), "c");
  const next = NotesApp.deleteSelectedNote(state);

  assert.equal(next.selectedId, "b");
});

test("getVisibleNotes filters title and content case-insensitively", () => {
  const byTitle = NotesApp.getVisibleNotes(NotesApp.setSearch(stateWithThreeNotes(), "生"));
  const byContent = NotesApp.getVisibleNotes(NotesApp.setSearch(stateWithThreeNotes(), "咖啡"));

  assert.deepEqual(
    byTitle.map((note) => note.id),
    ["b"],
  );
  assert.deepEqual(
    byContent.map((note) => note.id),
    ["b"],
  );
});

test("getVisibleNotes sorts by most recently updated", () => {
  const state = NotesApp.updateSelectedNote(stateWithThreeNotes(), { content: "新的会议纪要" }, {
    now: "2026-01-06T00:00:00.000Z",
  });

  assert.deepEqual(
    NotesApp.getVisibleNotes(state).map((note) => note.id),
    ["b", "c", "a"],
  );
});

test("deserializeState rejects invalid storage payloads", () => {
  assert.equal(NotesApp.deserializeState("not json"), null);
  assert.equal(NotesApp.deserializeState(JSON.stringify({ notes: "bad" })), null);
});

test("getDisplayTitle falls back for blank titles", () => {
  assert.equal(NotesApp.getDisplayTitle({ title: "   " }), NotesApp.UNTITLED);
});

test("index.html contains the two-pane note layout", () => {
  const html = fs.readFileSync("index.html", "utf8");

  assert.match(html, /class="app-shell"/);
  assert.match(html, /<aside class="sidebar"/);
  assert.match(html, /<section class="editor"/);
  assert.match(html, /id="noteList"/);
  assert.match(html, /id="contentInput"/);
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/app\.js"/);
});
