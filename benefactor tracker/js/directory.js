/* --- JS/DIRECTORY.JS --- */
/* Directory Logic: Renders table, filters search, manages modal operations */

const Directory = {
    init() {
        this.renderTable();
        this.bindEvents();
    },

    renderTable(filterText = "") {
        const tbody = document.getElementById("benefactor-table-body");
        const benefactors = Store.getBenefactors();
        
        const filtered = benefactors.filter(b => {
            const query = filterText.toLowerCase();
            return (b.name && b.name.toLowerCase().includes(query)) || 
                   (b.organization && b.organization.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No benefactor records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        filtered.forEach(b => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <strong>${b.name}</strong><br>
                    <span style="font-size: 11px; color: var(--text-muted);">${b.organization || 'Independent'}</span>
                </td>
                <td>
                    Email: ${b.email || 'N/A'}<br>
                    Phone: ${b.phone || 'N/A'}
                </td>
                <td>${b.birthday || 'N/A'}</td>
                <td>${b.last_contacted_date || 'N/A'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-outline" onclick="Directory.openEditModal('${b.id}')">Edit</button>
                        <button class="btn btn-outline" style="color: var(--accent-red); border-color: var(--accent-red);" onclick="Directory.handleDelete('${b.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    bindEvents() {
        // Phone number restriction listener
        const phoneInput = document.getElementById("b-phone");
        if (phoneInput && !phoneInput.dataset.restricted) {
            phoneInput.dataset.restricted = "true";
            phoneInput.addEventListener("input", (e) => {
                // Allow only numbers, spaces, plus signs, dashes, and parentheses
                e.target.value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
            });
        }

        // Search filter listener
        const searchInput = document.getElementById("directory-search");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.renderTable(e.target.value);
            });
        }

        // Modal triggers
        const modal = document.getElementById("benefactor-modal");
        const openBtn = document.getElementById("open-add-modal-btn");
        const closeBtn = document.getElementById("close-modal-btn");
        const form = document.getElementById("benefactor-form");

        if (openBtn) {
            openBtn.addEventListener("click", () => {
                document.getElementById("modal-title").innerText = "Add New Benefactor";
                document.getElementById("benefactor-id").value = "";
                form.reset();
                modal.style.display = "flex";
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
            });
        }

        if (form) {
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const id = document.getElementById("benefactor-id").value;
                const formData = {
                    name: document.getElementById("b-name").value,
                    organization: document.getElementById("b-org").value,
                    email: document.getElementById("b-email").value,
                    phone: document.getElementById("b-phone").value,
                    birthday: document.getElementById("b-birthday").value,
                    last_contacted_date: document.getElementById("b-last-contact").value,
                    notes: document.getElementById("b-notes").value
                };

                if (id) {
                    Store.updateBenefactor(id, formData);
                } else {
                    Store.addBenefactor(formData);
                }

                modal.style.display = "none";
                this.renderTable();
                // Also update dashboard views if needed
                if (typeof Dashboard !== 'undefined') Dashboard.init();
            });
        }
    },

    openEditModal(id) {
        const benefactors = Store.getBenefactors();
        const b = benefactors.find(item => item.id === id);
        if (!b) return;

        document.getElementById("modal-title").innerText = "Edit Benefactor Record";
        document.getElementById("benefactor-id").value = b.id;
        document.getElementById("b-name").value = b.name || "";
        document.getElementById("b-org").value = b.organization || "";
        document.getElementById("b-email").value = b.email || "";
        document.getElementById("b-phone").value = b.phone || "";
        document.getElementById("b-birthday").value = b.birthday || "";
        document.getElementById("b-last-contact").value = b.last_contacted_date || "";
        document.getElementById("b-notes").value = b.notes || "";

        document.getElementById("benefactor-modal").style.display = "flex";
    },

    handleDelete(id) {
        if (confirm("Are you sure you want to delete this benefactor record?")) {
            Store.deleteBenefactor(id);
            this.renderTable();
            if (typeof Dashboard !== 'undefined') Dashboard.init();
        }
    }
};

