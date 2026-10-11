
const loadButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const status = document.getElementById("status");
const usersList = document.getElementById("users-list");

const API_URL = "https://jsonplaceholder.typicode.com/users";

let users = [];
let usersLoaded = false;

async function loadUsers() {
  loadButton.disabled = true;
  status.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    users = await response.json();
    usersLoaded = true;

    renderUsers(users);
  } catch (error) {
    status.textContent = `Error loading users: ${error.message}`;
    usersList.replaceChildren();
  } finally {
    loadButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    status.textContent = usersLoaded
      ? "No users match your filter."
      : "No users to display.";
    return;
  }

  list.forEach((user) => {
    const item = document.createElement("li");
    const name = document.createElement("h2");
    const email = document.createElement("p");
    const city = document.createElement("p");
    const company = document.createElement("p");

    name.textContent = user.name;
    email.textContent = `Email: ${user.email}`;
    city.textContent = `City: ${user.address.city}`;
    company.textContent = `Company: ${user.company.name}`;

    item.append(name, email, city, company);
    usersList.appendChild(item);
  });

  status.textContent = `Showing ${list.length} user(s).`;
}

loadButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  if (!usersLoaded) {
    return;
  }

  const searchText = filterInput.value.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchText)
  );

  renderUsers(filteredUsers);
});