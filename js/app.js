/* --- JS/APP.JS --- */
/* App Router, Session Controller, and Event Binders */

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});

const App = {
    init() {
        this.checkAuthSession();
        this.bindNavigation();
        this.bindAuthEvents();
        this.bindBackupEvents();
        this.bindUserManagement();
    },

    // Check if user session exists; toggle login overlay vs main app container
    checkAuthSession() {
        const currentUser = Store.getCurrentUser();
        const authOverlay = document.getElementById("auth-overlay");
        const appContainer = document.getElementById("app-container");
        const userDisplay = document.getElementById("current-user-display");

        if (currentUser) {
            authOverlay.style.display = "none";
            appContainer.style.display = "flex";
            if (userDisplay) userDisplay.innerText = currentUser.username;

            // Initialize views
            Dashboard.init();
            Directory.init();
            this.renderUserManagementList();
        } else {
            authOverlay.style.display = "flex";
            appContainer.style.display = "none";
        }
    },

    // Handle View Switching (Dashboard, Directory, Users)
    bindNavigation() {
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                const targetId = e.currentTarget.getAttribute("data-target");

                // Update active states on nav buttons
                navLinks.forEach(l => l.classList.remove("active"));
                e.currentTarget.classList.add("active");

                // Toggle visibility of views
                document.querySelectorAll(".app-view").forEach(view => {
                    view.style.display = "none";
                });

                const targetView = document.getElementById(targetId);
                if (targetView) {
                    targetView.style.display = "block";
                }

                // Update Topbar Heading
                const headings = {
                    "dashboard-view": "Dashboard",
                    "directory-view": "Benefactor Directory",
                    "users-view": "System User Accounts"
                };
                const headingEl = document.getElementById("view-heading");
                if (headingEl) {
                    headingEl.innerText = headings[targetId] || "Dashboard";
                }
            });
        });
    },

    // Bind Login & Logout Listeners
    bindAuthEvents() {
        const loginForm = document.getElementById("login-form");
        const loginError = document.getElementById("login-error");
        const logoutBtn = document.getElementById("logout-btn");

        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.getElementById("login-username").value.trim();
                const pin = document.getElementById("login-pin").value.trim();

                const result = Store.login(username, pin);
                if (result.success) {
                    loginError.innerText = "";
                    loginForm.reset();
                    this.checkAuthSession();
                } else {
                    loginError.innerText = result.message;
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                Store.logout();
                this.checkAuthSession();
            });
        }
    },

    // Bind Backup JSON Export & Import Triggers
    bindBackupEvents() {
        const exportBtn = document.getElementById("export-btn");
        const importFile = document.getElementById("import-file");

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                Store.exportDatabase();
            });
        }

        if (importFile) {
            importFile.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                Store.importDatabase(file, (success, message) => {
                    alert(message);
                    if (success) {
                        // Refresh all views with imported data
                        Dashboard.init();
                        Directory.init();
                        this.renderUserManagementList();
                    }
                    // Reset input
                    importFile.value = "";
                });
            });
        }
    },

    // Bind User Management form and self-deletion rules
    bindUserManagement() {
        const addUserForm = document.getElementById("add-user-form");
        if (addUserForm) {
            addUserForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.getElementById("new-username").value.trim();
                const pin = document.getElementById("new-pin").value.trim();

                const res = Store.addUser(username, pin);
                alert(res.message);
                if (res.success) {
                    addUserForm.reset();
                    this.renderUserManagementList();
                }
            });
        }
    },

    renderUserManagementList() {
        const container = document.getElementById("user-list-container");
        if (!container) return;

        const users = Store.getUsers();
        const currentUser = Store.getCurrentUser();

        container.innerHTML = "<h4>Registered Accounts</h4>";
        const listDiv = document.createElement("div");
        listDiv.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-top: 10px;";

        users.forEach(u => {
            const isMe = currentUser && currentUser.id === u.id;
            const item = document.createElement("div");
            item.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #FAFAFC; border: 1px solid var(--border-color); border-radius: var(--radius-sharp);";
            
            item.innerHTML = `
                <div>
                    <strong>${u.username}</strong> ${isMe ? '<span class="badge-offline" style="background-color: var(--primary); color: #fff; margin-left: 6px;">Active Session</span>' : ''}
                    <div style="font-size: 11px; color: var(--text-muted);">ID: ${u.id}</div>
                </div>
                <div>
                    ${isMe ? `<button class="btn btn-outline" style="color: var(--accent-red); border-color: var(--accent-red); font-size: 11px;" onclick="App.promptSelfDelete('${u.id}')">Delete My Account</button>` : '<span style="font-size: 11px; color: var(--text-muted);">Protected</span>'}
                </div>
            `;
            listDiv.appendChild(item);
        });

        container.appendChild(listDiv);
    },

    promptSelfDelete(userId) {
        const pinConfirm = prompt("Security Verification: Enter your PIN code to confirm account deletion:");
        if (pinConfirm === null) return; // cancelled

        const res = Store.deleteUser(userId, pinConfirm.trim());
        alert(res.message);
        if (res.success) {
            this.checkAuthSession(); // will route back to login overlay
        }
    }

    
};