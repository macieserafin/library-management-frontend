const state = {
  apiBase: localStorage.getItem("libraryApiBase") || "http://localhost:8080",
  libraries: [],
  books: [],
  users: [],
  borrows: []
};

const els = {
  apiForm: document.querySelector("#api-form"),
  apiUrl: document.querySelector("#api-url"),
  status: document.querySelector("#connection-status"),
  log: document.querySelector("#log"),
  librariesList: document.querySelector("#libraries-list"),
  booksList: document.querySelector("#books-list"),
  usersList: document.querySelector("#users-list"),
  borrowsList: document.querySelector("#borrows-list"),
  libraryForm: document.querySelector("#library-form"),
  bookForm: document.querySelector("#book-form"),
  userForm: document.querySelector("#user-form"),
  borrowForm: document.querySelector("#borrow-form"),
  bookFilterForm: document.querySelector("#book-filter-form")
};

els.apiUrl.value = state.apiBase;

function log(message, data) {
  const time = new Date().toLocaleTimeString();
  const details = data ? `\n${JSON.stringify(data, null, 2)}` : "";
  els.log.textContent = `[${time}] ${message}${details}\n\n${els.log.textContent}`;
}

function setStatus(message, type = "") {
  els.status.textContent = message;
  els.status.className = `status-pill ${type}`.trim();
}

async function request(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data;
}

function getFormData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function resetForm(form) {
  form.reset();
  const idInput = form.querySelector('input[name="id"]');
  if (idInput) idInput.value = "";
}

function optionLabel(item, fallback) {
  return item?.name || item?.title || item?.email || fallback;
}

function fillSelect(select, items, emptyText) {
  select.innerHTML = "";
  if (!items.length) {
    select.append(new Option(emptyText, ""));
    return;
  }
  items.forEach((item) => select.append(new Option(`${item.id} - ${optionLabel(item, "brak nazwy")}`, item.id)));
}

function renderEmpty(tbody, colspan, message) {
  tbody.innerHTML = `<tr><td class="empty-row" colspan="${colspan}">${message}</td></tr>`;
}

function renderLibraries() {
  if (!state.libraries.length) {
    renderEmpty(els.librariesList, 3, "Brak bibliotek");
  } else {
    els.librariesList.innerHTML = state.libraries.map((library) => `
      <tr>
        <td>${library.id}</td>
        <td>${library.name || ""}</td>
        <td class="actions-cell">
          <button type="button" data-edit-library="${library.id}">Edytuj</button>
          <button type="button" class="danger" data-delete-library="${library.id}">Usun</button>
        </td>
      </tr>
    `).join("");
  }

  fillSelect(els.bookForm.elements.libraryId, state.libraries, "Najpierw dodaj biblioteke");
}

function renderBooks(books = state.books) {
  if (!books.length) {
    renderEmpty(els.booksList, 6, "Brak ksiazek");
  } else {
    els.booksList.innerHTML = books.map((book) => `
      <tr>
        <td>${book.id}</td>
        <td>${book.title || ""}</td>
        <td>${book.author || ""}</td>
        <td>${book.year || ""}</td>
        <td>${book.library?.name || book.library?.id || ""}</td>
        <td class="actions-cell">
          <button type="button" data-edit-book="${book.id}">Edytuj</button>
          <button type="button" class="danger" data-delete-book="${book.id}">Usun</button>
        </td>
      </tr>
    `).join("");
  }

  fillSelect(els.borrowForm.elements.bookId, state.books, "Najpierw dodaj ksiazke");
}

function renderUsers() {
  if (!state.users.length) {
    renderEmpty(els.usersList, 5, "Brak uzytkownikow");
  } else {
    els.usersList.innerHTML = state.users.map((user) => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name || ""}</td>
        <td>${user.email || ""}</td>
        <td>${user.userType || ""}</td>
        <td class="actions-cell">
          <button type="button" data-edit-user="${user.id}">Edytuj</button>
          <button type="button" class="danger" data-delete-user="${user.id}">Usun</button>
        </td>
      </tr>
    `).join("");
  }

  fillSelect(els.borrowForm.elements.userId, state.users, "Najpierw dodaj uzytkownika");
}

function renderBorrows() {
  if (!state.borrows.length) {
    renderEmpty(els.borrowsList, 6, "Brak wypozyczen");
    return;
  }

  els.borrowsList.innerHTML = state.borrows.map((borrow) => `
    <tr>
      <td>${borrow.id}</td>
      <td>${borrow.user?.name || borrow.user?.email || ""}</td>
      <td>${borrow.book?.title || ""}</td>
      <td>${borrow.borrowDate || ""}</td>
      <td>${borrow.returnDate || "aktywnie"}</td>
      <td class="actions-cell">
        ${borrow.returnDate ? "" : `<button type="button" data-return-borrow="${borrow.id}">Zwroc</button>`}
      </td>
    </tr>
  `).join("");
}

async function refreshLibraries() {
  state.libraries = await request("/libraries");
  renderLibraries();
}

async function refreshBooks() {
  state.books = await request("/books");
  renderBooks();
}

async function refreshUsers() {
  state.users = await request("/users");
  renderUsers();
}

async function refreshBorrows() {
  state.borrows = await request("/borrows");
  renderBorrows();
}

async function refreshAll() {
  try {
    await Promise.all([refreshLibraries(), refreshUsers()]);
    await refreshBooks();
    await refreshBorrows();
    setStatus("Backend odpowiada", "ok");
    log("Dane odswiezone");
  } catch (error) {
    setStatus(`Blad polaczenia: ${error.message}`, "error");
    log("Nie udalo sie odswiezyc danych", { error: error.message });
  }
}

async function saveLibrary(event) {
  event.preventDefault();
  const data = getFormData(els.libraryForm);
  const payload = { name: data.name };
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/libraries/${data.id}` : "/libraries";
  const saved = await request(path, { method, body: JSON.stringify(payload) });
  resetForm(els.libraryForm);
  await refreshLibraries();
  log("Zapisano biblioteke", saved);
}

async function saveBook(event) {
  event.preventDefault();
  const data = getFormData(els.bookForm);
  const payload = {
    title: data.title,
    author: data.author,
    year: Number(data.year),
    library: { id: Number(data.libraryId) }
  };
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/books/${data.id}` : "/books";
  const saved = await request(path, { method, body: JSON.stringify(payload) });
  resetForm(els.bookForm);
  await refreshBooks();
  log("Zapisano ksiazke", saved);
}

async function saveUser(event) {
  event.preventDefault();
  const data = getFormData(els.userForm);
  const payload = {
    name: data.name,
    email: data.email,
    userType: data.userType
  };
  const method = data.id ? "PUT" : "POST";
  const path = data.id ? `/users/${data.id}` : "/users";
  const saved = await request(path, { method, body: JSON.stringify(payload) });
  resetForm(els.userForm);
  await refreshUsers();
  log("Zapisano uzytkownika", saved);
}

async function borrowBook(event) {
  event.preventDefault();
  const data = getFormData(els.borrowForm);
  const saved = await request(`/borrows?userId=${encodeURIComponent(data.userId)}&bookId=${encodeURIComponent(data.bookId)}`, {
    method: "POST",
    headers: {}
  });
  await refreshBorrows();
  log("Wypozyczono ksiazke", saved);
}

async function filterBooks(event) {
  event.preventDefault();
  const data = getFormData(els.bookFilterForm);
  const payload = {};
  if (data.title) payload.title = data.title;
  if (data.author) payload.author = data.author;
  if (data.year) payload.year = Number(data.year);
  const filtered = await request("/books/filter", { method: "POST", body: JSON.stringify(payload) });
  renderBooks(filtered);
  log("Przefiltrowano ksiazki", filtered);
}

async function handleClick(event) {
  const target = event.target;

  if (target.matches("[data-reset-form]")) {
    resetForm(document.getElementById(target.dataset.resetForm));
    return;
  }

  if (target.matches("[data-refresh]")) {
    await refreshByName(target.dataset.refresh);
    return;
  }

  const actions = [
    ["editLibrary", "data-edit-library", editLibrary],
    ["deleteLibrary", "data-delete-library", deleteLibrary],
    ["editBook", "data-edit-book", editBook],
    ["deleteBook", "data-delete-book", deleteBook],
    ["editUser", "data-edit-user", editUser],
    ["deleteUser", "data-delete-user", deleteUser],
    ["returnBorrow", "data-return-borrow", returnBorrow]
  ];

  for (const [, attr, handler] of actions) {
    const id = target.getAttribute(attr);
    if (id) {
      await handler(id);
      return;
    }
  }
}

async function refreshByName(name) {
  const map = {
    libraries: refreshLibraries,
    books: refreshBooks,
    users: refreshUsers,
    borrows: refreshBorrows
  };
  try {
    await map[name]();
    log(`Odswiezono: ${name}`);
  } catch (error) {
    log(`Blad odswiezania: ${name}`, { error: error.message });
  }
}

function editLibrary(id) {
  const library = state.libraries.find((item) => String(item.id) === String(id));
  if (!library) return;
  els.libraryForm.elements.id.value = library.id;
  els.libraryForm.elements.name.value = library.name || "";
}

async function deleteLibrary(id) {
  await request(`/libraries/${id}`, { method: "DELETE", headers: {} });
  await refreshAll();
  log("Usunieto biblioteke", { id });
}

function editBook(id) {
  const book = state.books.find((item) => String(item.id) === String(id));
  if (!book) return;
  els.bookForm.elements.id.value = book.id;
  els.bookForm.elements.title.value = book.title || "";
  els.bookForm.elements.author.value = book.author || "";
  els.bookForm.elements.year.value = book.year || "";
  els.bookForm.elements.libraryId.value = book.library?.id || "";
}

async function deleteBook(id) {
  await request(`/books/${id}`, { method: "DELETE", headers: {} });
  await refreshAll();
  log("Usunieto ksiazke", { id });
}

function editUser(id) {
  const user = state.users.find((item) => String(item.id) === String(id));
  if (!user) return;
  els.userForm.elements.id.value = user.id;
  els.userForm.elements.name.value = user.name || "";
  els.userForm.elements.email.value = user.email || "";
  els.userForm.elements.userType.value = user.userType || "STUDENT";
}

async function deleteUser(id) {
  await request(`/users/${id}`, { method: "DELETE", headers: {} });
  await refreshAll();
  log("Usunieto uzytkownika", { id });
}

async function returnBorrow(id) {
  const saved = await request(`/borrows/${id}/return`, { method: "PUT", headers: {} });
  await refreshBorrows();
  log("Zwrocono ksiazke", saved);
}

function bindEvents() {
  els.apiForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.apiBase = els.apiUrl.value.replace(/\/$/, "");
    localStorage.setItem("libraryApiBase", state.apiBase);
    await refreshAll();
  });

  document.querySelector("#refresh-all").addEventListener("click", refreshAll);
  document.querySelector("#clear-log").addEventListener("click", () => {
    els.log.textContent = "";
  });
  document.querySelector("#clear-book-filter").addEventListener("click", async () => {
    els.bookFilterForm.reset();
    renderBooks();
  });

  els.libraryForm.addEventListener("submit", wrap(saveLibrary));
  els.bookForm.addEventListener("submit", wrap(saveBook));
  els.userForm.addEventListener("submit", wrap(saveUser));
  els.borrowForm.addEventListener("submit", wrap(borrowBook));
  els.bookFilterForm.addEventListener("submit", wrap(filterBooks));
  document.addEventListener("click", (event) => wrap(handleClick)(event));
}

function wrap(handler) {
  return async (event) => {
    try {
      await handler(event);
    } catch (error) {
      setStatus(`Blad: ${error.message}`, "error");
      log("Operacja nie powiodla sie", { error: error.message });
    }
  };
}

bindEvents();
refreshAll();
