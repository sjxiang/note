(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NotesApp = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY = "html-notes:v1";
  const THEME_STORAGE_KEY = "html-notes:theme";
  const UNTITLED = "未命名笔记";
  const THEMES = ["light", "dark"];

  function createId() {
    return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function timestamp() {
    return new Date().toISOString();
  }

  function cleanText(value) {
    return typeof value === "string" ? value : "";
  }

  function normalizeTheme(theme) {
    return THEMES.includes(theme) ? theme : "light";
  }

  function createNote(overrides = {}) {
    const now = overrides.now || timestamp();
    return {
      id: overrides.id || createId(),
      title: cleanText(overrides.title),
      content: cleanText(overrides.content),
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }

  function normalizeNote(note) {
    if (!note || typeof note !== "object" || !note.id) {
      return null;
    }

    const createdAt = cleanText(note.createdAt) || timestamp();
    return {
      id: String(note.id),
      title: cleanText(note.title),
      content: cleanText(note.content),
      createdAt,
      updatedAt: cleanText(note.updatedAt) || createdAt,
    };
  }

  function createState(notes = [], selectedId = null, search = "") {
    const normalizedNotes = notes.map(normalizeNote).filter(Boolean);
    const validSelection = normalizedNotes.some((note) => note.id === selectedId);

    return {
      notes: normalizedNotes,
      selectedId: validSelection ? selectedId : normalizedNotes[0]?.id || null,
      search: cleanText(search),
    };
  }

  function createWelcomeState() {
    const note = createNote({
      id: "welcome",
      title: "第一条笔记",
      content: "在这里记录想法、任务和片段。左侧切换笔记，右侧编辑内容。",
    });

    return createState([note], note.id);
  }

  function getSelectedNote(state) {
    return state.notes.find((note) => note.id === state.selectedId) || null;
  }

  function getDisplayTitle(note) {
    const title = cleanText(note?.title).trim();
    return title || UNTITLED;
  }

  function getPreview(note) {
    const content = cleanText(note?.content).trim().replace(/\s+/g, " ");
    return content || "暂无内容";
  }

  function sortByUpdatedAt(notes) {
    return [...notes].sort((left, right) => {
      if (left.updatedAt === right.updatedAt) {
        return left.createdAt < right.createdAt ? 1 : -1;
      }

      return left.updatedAt < right.updatedAt ? 1 : -1;
    });
  }

  function getVisibleNotes(state) {
    const query = cleanText(state.search).trim().toLowerCase();
    const notes = query
      ? state.notes.filter((note) => {
          const haystack = `${note.title}\n${note.content}`.toLowerCase();
          return haystack.includes(query);
        })
      : state.notes;

    return sortByUpdatedAt(notes);
  }

  function addNote(state, options = {}) {
    const note = createNote(options);
    return {
      ...state,
      notes: [note, ...state.notes],
      selectedId: note.id,
      search: "",
    };
  }

  function selectNote(state, noteId) {
    if (!state.notes.some((note) => note.id === noteId)) {
      return state;
    }

    return { ...state, selectedId: noteId };
  }

  function setSearch(state, search) {
    return { ...state, search: cleanText(search) };
  }

  function updateSelectedNote(state, patch, options = {}) {
    const selected = getSelectedNote(state);
    if (!selected) {
      return state;
    }

    const now = options.now || timestamp();
    const notes = state.notes.map((note) => {
      if (note.id !== selected.id) {
        return note;
      }

      return {
        ...note,
        title: Object.prototype.hasOwnProperty.call(patch, "title") ? cleanText(patch.title) : note.title,
        content: Object.prototype.hasOwnProperty.call(patch, "content") ? cleanText(patch.content) : note.content,
        updatedAt: now,
      };
    });

    return { ...state, notes };
  }

  function deleteSelectedNote(state) {
    const selectedIndex = state.notes.findIndex((note) => note.id === state.selectedId);
    if (selectedIndex === -1) {
      return state;
    }

    const notes = state.notes.filter((note) => note.id !== state.selectedId);
    const nextNote = notes[selectedIndex] || notes[selectedIndex - 1] || null;

    return {
      ...state,
      notes,
      selectedId: nextNote?.id || null,
    };
  }

  function serializeState(state) {
    return JSON.stringify({
      notes: state.notes,
      selectedId: state.selectedId,
    });
  }

  function deserializeState(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.notes)) {
        return null;
      }

      return createState(parsed.notes, parsed.selectedId);
    } catch {
      return null;
    }
  }

  function loadState(storage) {
    const loaded = deserializeState(storage.getItem(STORAGE_KEY));
    return loaded && loaded.notes.length > 0 ? loaded : createWelcomeState();
  }

  function saveState(storage, state) {
    storage.setItem(STORAGE_KEY, serializeState(state));
  }

  function loadTheme(storage) {
    return normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
  }

  function saveTheme(storage, theme) {
    const normalizedTheme = normalizeTheme(theme);
    storage.setItem(THEME_STORAGE_KEY, normalizedTheme);
    return normalizedTheme;
  }

  function applyTheme(rootElement, theme) {
    const normalizedTheme = normalizeTheme(theme);
    rootElement.dataset.theme = normalizedTheme;
    return normalizedTheme;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function mount(root, options = {}) {
    if (!root) {
      throw new Error("Notes app root element is required.");
    }

    const storage = options.storage || window.localStorage;
    let state = loadState(storage);
    let theme = loadTheme(storage);

    const elements = {
      newNoteButton: root.querySelector("#newNoteButton"),
      deleteNoteButton: root.querySelector("#deleteNoteButton"),
      searchInput: root.querySelector("#searchInput"),
      noteList: root.querySelector("#noteList"),
      noteMeta: root.querySelector("#noteMeta"),
      titleInput: root.querySelector("#titleInput"),
      contentInput: root.querySelector("#contentInput"),
      emptyEditor: root.querySelector("#emptyEditor"),
      themeInputs: root.querySelectorAll('input[name="theme"]'),
    };

    function persist() {
      saveState(storage, state);
    }

    function persistTheme() {
      saveTheme(storage, theme);
    }

    function renderTheme() {
      applyTheme(document.documentElement, theme);
      for (const input of elements.themeInputs) {
        input.checked = input.value === theme;
      }
    }

    function renderList() {
      const visibleNotes = getVisibleNotes(state);
      elements.noteList.innerHTML = "";

      if (visibleNotes.length === 0) {
        const empty = document.createElement("p");
        empty.className = "list-empty";
        empty.textContent = state.search ? "没有匹配的笔记" : "暂无笔记";
        elements.noteList.append(empty);
        return;
      }

      for (const note of visibleNotes) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `note-item${note.id === state.selectedId ? " is-active" : ""}`;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(note.id === state.selectedId));
        item.dataset.noteId = note.id;

        const title = document.createElement("span");
        title.className = "note-item-title";
        title.textContent = getDisplayTitle(note);

        const preview = document.createElement("span");
        preview.className = "note-item-preview";
        preview.textContent = getPreview(note);

        const time = document.createElement("span");
        time.className = "note-item-time";
        time.textContent = formatDate(note.updatedAt);

        item.append(title, preview, time);
        elements.noteList.append(item);
      }
    }

    function renderEditor() {
      const selectedNote = getSelectedNote(state);
      const hasNote = Boolean(selectedNote);

      elements.titleInput.disabled = !hasNote;
      elements.contentInput.disabled = !hasNote;
      elements.deleteNoteButton.disabled = !hasNote;
      elements.emptyEditor.hidden = hasNote;

      if (!selectedNote) {
        elements.noteMeta.textContent = "自动保存";
        elements.titleInput.value = "";
        elements.contentInput.value = "";
        return;
      }

      elements.noteMeta.textContent = `自动保存 · ${formatDate(selectedNote.updatedAt)}`;

      if (document.activeElement !== elements.titleInput && elements.titleInput.value !== selectedNote.title) {
        elements.titleInput.value = selectedNote.title;
      }

      if (document.activeElement !== elements.contentInput && elements.contentInput.value !== selectedNote.content) {
        elements.contentInput.value = selectedNote.content;
      }
    }

    function render() {
      if (elements.searchInput.value !== state.search) {
        elements.searchInput.value = state.search;
      }

      renderTheme();
      renderList();
      renderEditor();
    }

    elements.newNoteButton.addEventListener("click", () => {
      state = addNote(state);
      persist();
      render();
      elements.titleInput.focus();
    });

    elements.deleteNoteButton.addEventListener("click", () => {
      const selectedNote = getSelectedNote(state);
      if (!selectedNote) {
        return;
      }

      if (window.confirm(`删除“${getDisplayTitle(selectedNote)}”？`)) {
        state = deleteSelectedNote(state);
        persist();
        render();
      }
    });

    elements.searchInput.addEventListener("input", (event) => {
      state = setSearch(state, event.target.value);
      renderList();
    });

    elements.noteList.addEventListener("click", (event) => {
      const item = event.target.closest("[data-note-id]");
      if (!item) {
        return;
      }

      state = selectNote(state, item.dataset.noteId);
      render();
    });

    elements.titleInput.addEventListener("input", (event) => {
      state = updateSelectedNote(state, { title: event.target.value });
      persist();
      renderList();
      renderEditor();
    });

    elements.contentInput.addEventListener("input", (event) => {
      state = updateSelectedNote(state, { content: event.target.value });
      persist();
      renderList();
      renderEditor();
    });

    for (const input of elements.themeInputs) {
      input.addEventListener("change", (event) => {
        if (!event.target.checked) {
          return;
        }

        theme = normalizeTheme(event.target.value);
        persistTheme();
        renderTheme();
      });
    }

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist();
      }
    });

    render();

    return {
      getState: () => state,
      getTheme: () => theme,
      setState(nextState) {
        state = createState(nextState.notes, nextState.selectedId, nextState.search);
        persist();
        render();
      },
      setTheme(nextTheme) {
        theme = normalizeTheme(nextTheme);
        persistTheme();
        renderTheme();
      },
    };
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.querySelector("#app");
      if (root) {
        mount(root);
      }
    });
  }

  return {
    STORAGE_KEY,
    THEME_STORAGE_KEY,
    UNTITLED,
    addNote,
    applyTheme,
    createNote,
    createState,
    deleteSelectedNote,
    deserializeState,
    getDisplayTitle,
    getPreview,
    getSelectedNote,
    getVisibleNotes,
    loadTheme,
    normalizeTheme,
    saveTheme,
    selectNote,
    serializeState,
    setSearch,
    updateSelectedNote,
  };
});
