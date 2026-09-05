const DonationsModule = {
    init() {
        console.log("DonationsModule initialized.");
        this.render();
        this.setupEventListeners();
        this.initAccountSettings();

        const dateInput = document.getElementById('don-date');
        if (dateInput && !dateInput.value) {
            dateInput.valueAsDate = new Date();
        }
    },

    render() {
        const sortSelect = document.getElementById('donation-sort-select');
        const sortMode = sortSelect ? sortSelect.value : 'date-desc';
        
        const donations = Store.getDonations();
        
        donations.sort((a, b) => {
            if (sortMode === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sortMode === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sortMode === 'value-desc') return b.value - a.value;
            if (sortMode === 'type') return a.type.localeCompare(b.type);
            if (sortMode === 'scholarship') return (a.scholarshipType || '').localeCompare(b.scholarshipType || '');
            return 0;
        });

        let totalVal = 0;
        let cashVal = 0;
        let itemCount = 0;

        const tbody = document.getElementById('donations-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (donations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 20px;">No active donations in pool.</td></tr>`;
        }

        donations.forEach(d => {
            const isClaimed = d.status === 'claimed';
            
            if (!isClaimed) {
                totalVal += Number(d.value);
                if (d.type === 'Cash') cashVal += Number(d.value);
                else itemCount++;
            }

            const badgeClass = d.type === 'Cash' ? 'badge-cash' : (d.type === 'Food' ? 'badge-food' : 'badge-others');

            const tr = document.createElement('tr');
            
            // Hover Tooltip Implementation
            tr.title = isClaimed 
                ? `Taken on: ${d.claimedDate || 'N/A'} | Donated by: ${d.benefactor} on ${d.date}`
                : `Donated by: ${d.benefactor} on ${d.date}`;

            if (isClaimed) {
                tr.style.backgroundColor = "#F8F9FA";
                tr.style.color = "#ADB5BD";
                tr.style.textDecoration = "line-through";
            }

            tr.innerHTML = `
                <td>${d.date}</td>
                <td><code>${d.orNumber || 'N/A'}</code></td>
                <td><strong>${d.benefactor}</strong></td>
                <td>${d.scholarshipType || 'General'}</td>
                <td><span class="badge-type ${badgeClass}">${d.type}</span></td>
                <td>${d.description}</td>
                <td>₱${Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center;">
                    <input type="checkbox" class="donation-status-checkbox" data-id="${d.id}" ${isClaimed ? 'checked' : ''} style="cursor: pointer; transform: scale(1.2);">
                    ${isClaimed && d.claimedDate ? `<div style="font-size: 0.75rem; text-decoration: none; margin-top: 2px;">Taken: ${d.claimedDate}</div>` : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline btn-edit-donation" data-id="${d.id}" type="button">Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const totalValEl = document.getElementById('metric-total-val');
        const cashValEl = document.getElementById('metric-cash-val');
        const itemCountEl = document.getElementById('metric-items-count');

        if (totalValEl) totalValEl.textContent = `₱${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (cashValEl) cashValEl.textContent = `₱${cashVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (itemCountEl) itemCountEl.textContent = itemCount;
    },

    initAccountSettings() {
        const user = Store.getCurrentUser() || Store.getUsers();
        const userField = document.getElementById('acc-username');
        const pinField = document.getElementById('acc-pin');
        if (userField && user) userField.value = user.username || '';
        if (pinField && user) pinField.value = user.pin || '';

        const toggleBtn = document.getElementById('toggle-pin-visibility');
        if (toggleBtn && !toggleBtn.dataset.listenerAttached) {
            toggleBtn.dataset.listenerAttached = "true";
            toggleBtn.addEventListener('click', () => {
                if (pinField.type === 'password') {
                    pinField.type = 'text';
                    toggleBtn.textContent = '🔒';
                } else {
                    pinField.type = 'password';
                    toggleBtn.textContent = '👁';
                }
            });
        }
    },

    setupEventListeners() {
        // 1. Cancel and Close buttons for the Report Modal
        ['close-report-modal-btn', 'cancel-report-modal-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.listenerAttached) {
                btn.dataset.listenerAttached = "true";
                btn.addEventListener('click', () => {
                    document.getElementById('report-edit-modal').style.display = 'none';
                });
            }
        });

        // 2. Close button for the Donation Edit Modal
    const closeDonationEditBtn = document.getElementById('close-donation-edit-modal');
    if (closeDonationEditBtn) {
        closeDonationEditBtn.addEventListener('click', () => {
            const modal = document.getElementById('donation-edit-modal');
            if (modal) modal.style.display = 'none';
        });
    }

        const reportEditForm = document.getElementById('report-edit-form');
        if (reportEditForm && !reportEditForm.dataset.listenerAttached) {
            reportEditForm.dataset.listenerAttached = "true";
            reportEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                localStorage.setItem('adzu_report_remarks', document.getElementById('rep-remarks-input').value);
                localStorage.setItem('adzu_report_signer_name', document.getElementById('rep-signer-name-input').value);
                localStorage.setItem('adzu_report_signer_pos', document.getElementById('rep-signer-pos-input').value);
                document.getElementById('report-edit-modal').style.display = 'none';
            });
        }

        const editReportBtn = document.getElementById('btn-edit-report');
        if (editReportBtn && !editReportBtn.dataset.listenerAttached) {
            editReportBtn.dataset.listenerAttached = "true";
            editReportBtn.addEventListener('click', () => {
                document.getElementById('rep-remarks-input').value = localStorage.getItem('adzu_report_remarks') || 'All items listed represent active, undistributed inventory ready for allocation.';
                document.getElementById('rep-signer-name-input').value = localStorage.getItem('adzu_report_signer_name') || 'Office Worker Name';
                document.getElementById('rep-signer-pos-input').value = localStorage.getItem('adzu_report_signer_pos') || 'Position / Designation';
                document.getElementById('report-edit-modal').style.display = 'flex';
            });
        }

        const form = document.getElementById('donation-form');
        if (form && !form.dataset.listenerAttached) {
            form.dataset.listenerAttached = "true";
            form.addEventListener('submit', (e) => {
                e.preventDefault(); 
                const newDonation = {
                    benefactor: document.getElementById('don-benefactor').value,
                    orNumber: document.getElementById('don-or').value,
                    scholarshipType: document.getElementById('don-scholarship').value,
                    type: document.getElementById('don-type').value,
                    description: document.getElementById('don-desc').value,
                    value: document.getElementById('don-value').value,
                    date: document.getElementById('don-date').value
                };
                Store.saveDonation(newDonation);
                form.reset();
                const dateInput = document.getElementById('don-date');
                if (dateInput) dateInput.valueAsDate = new Date();
                DonationsModule.render(); 
            });
        }

        const editForm = document.getElementById('donation-edit-form');
        if (editForm && !editForm.dataset.listenerAttached) {
            editForm.dataset.listenerAttached = "true";
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-donation-id').value;
                const updatedData = {
                    benefactor: document.getElementById('edit-don-benefactor').value,
                    orNumber: document.getElementById('edit-don-or').value,
                    scholarshipType: document.getElementById('edit-don-scholarship').value,
                    type: document.getElementById('edit-don-type').value,
                    description: document.getElementById('edit-don-desc').value,
                    value: document.getElementById('edit-don-value').value,
                    date: document.getElementById('edit-don-date').value
                };
                Store.updateDonation(id, updatedData);
                document.getElementById('donation-edit-modal').style.display = 'none';
                DonationsModule.render();
            });
        }

        // Status Date Prompt Form Submission
        const statusDateForm = document.getElementById('status-date-form');
        if (statusDateForm && !statusDateForm.dataset.listenerAttached) {
            statusDateForm.dataset.listenerAttached = "true";
            statusDateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('status-donation-id').value;
                const claimDate = document.getElementById('claim-date-input').value;
                
                Store.updateDonationStatus(id, 'claimed', claimDate);
                document.getElementById('status-date-modal').style.display = 'none';
                DonationsModule.render();
            });
        }

        ['close-edit-modal-btn', 'cancel-edit-modal-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.listenerAttached) {
                btn.dataset.listenerAttached = "true";
                btn.addEventListener('click', () => {
                    document.getElementById('donation-edit-modal').style.display = 'none';
                });
            }
        });

        const closeStatusModal = () => {
            document.getElementById('status-date-modal').style.display = 'none';
            DonationsModule.render();
        };
        ['close-status-modal-btn', 'cancel-status-modal-btn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn && !btn.dataset.listenerAttached) {
                btn.dataset.listenerAttached = "true";
                btn.addEventListener('click', closeStatusModal);
            }
        });

        const accForm = document.getElementById('account-form');
        if (accForm && !accForm.dataset.listenerAttached) {
            accForm.dataset.listenerAttached = "true";
            accForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const u = document.getElementById('acc-username').value;
                const p = document.getElementById('acc-pin').value;
                const res = Store.updateAccount(u, p);
                const msg = document.getElementById('acc-msg');
                if (msg) {
                    msg.textContent = res.message;
                    msg.style.color = res.success ? 'green' : 'red';
                }
            });
        }

        const printBtn = document.getElementById('btn-print-report');
        if (printBtn && !printBtn.dataset.listenerAttached) {
            printBtn.dataset.listenerAttached = "true";
            printBtn.addEventListener('click', () => { DonationsModule.triggerPrintReport(); });
        }

        const sortSelect = document.getElementById('donation-sort-select');
        if (sortSelect && !sortSelect.dataset.listenerAttached) {
            sortSelect.dataset.listenerAttached = "true";
            sortSelect.addEventListener('change', () => { DonationsModule.render(); });
        }

        // Fix: Delegate listener at the Document level so it captures events accurately
        // even if the table DOM has been fully re-rendered.
// Fix: Use a custom property directly on the document object instead of .dataset
        if (!document._tableDelegationAttached) {
            document._tableDelegationAttached = true;
            document.addEventListener('click', (e) => {
                
                // 1. Handle Status Checkbox Toggle
                const checkbox = e.target.closest('.donation-status-checkbox');
                if (checkbox) {
                    const id = checkbox.getAttribute('data-id');
                    if (checkbox.checked) {
                        const idField = document.getElementById('status-donation-id');
                        if (idField) idField.value = id;
                        const dateInput = document.getElementById('claim-date-input');
                        if (dateInput) dateInput.valueAsDate = new Date();
                        const statusModal = document.getElementById('status-date-modal');
                        if (statusModal) statusModal.style.display = 'flex';
                    } else {
                        Store.updateDonationStatus(id, 'active', null);
                        DonationsModule.render();
                    }
                    return;
                }

                // 2. Handle Action Edit Button click
                const editBtn = e.target.closest('.btn-edit-donation');
                if (editBtn) {
                    const id = editBtn.getAttribute('data-id');
                    DonationsModule.openEditModal(id);
                }
            });
        }
    },

    openEditModal(id) {
        console.log("Edit button clicked for ID:", id);
        const donations = Store.getDonations();
        console.log("All donations in store:", donations);
        
        const d = donations.find(item => String(item.id) === String(id));
        if (!d) {
            console.warn("Donation item not found for ID:", id);
            return;
        }

        const idField = document.getElementById('edit-donation-id');
        const benefactorField = document.getElementById('edit-don-benefactor');
        const orField = document.getElementById('edit-don-or');
        const scholarshipField = document.getElementById('edit-don-scholarship');
        const typeField = document.getElementById('edit-don-type');
        const descField = document.getElementById('edit-don-desc');
        const valueField = document.getElementById('edit-don-value');
        const dateField = document.getElementById('edit-don-date');

        if (idField) idField.value = d.id;
        if (benefactorField) benefactorField.value = d.benefactor || '';
        if (orField) orField.value = d.orNumber || '';
        if (scholarshipField) scholarshipField.value = d.scholarshipType || '';
        if (typeField) typeField.value = d.type || 'Cash';
        if (descField) descField.value = d.description || '';
        if (valueField) valueField.value = d.value || '';
        if (dateField) dateField.value = d.date || '';

        const modal = document.getElementById('donation-edit-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            console.error("Modal element 'donation-edit-modal' not found in the DOM!");
        }
    },

    triggerPrintReport() {
        const customRemarks = localStorage.getItem('adzu_report_remarks') || 'All items listed represent active, undistributed inventory ready for allocation.';
        const customSignerName = localStorage.getItem('adzu_report_signer_name') || 'Office Worker Name';
        const customSignerPos = localStorage.getItem('adzu_report_signer_pos') || 'Position / Designation';

        const remarksEl = document.getElementById('print-remarks');
        const signerNameEl = document.getElementById('print-signer-name');
        const signerPosEl = document.getElementById('print-signer-pos');

        if (remarksEl) remarksEl.textContent = customRemarks;
        if (signerNameEl) signerNameEl.textContent = customSignerName;
        if (signerPosEl) signerPosEl.textContent = customSignerPos;
        
        const donations = Store.getDonations();
        const printTbody = document.getElementById('print-table-body');
        printTbody.innerHTML = '';

        let totalVal = 0;
        let cashVal = 0;
        let itemCount = 0;

        donations.forEach(d => {
            if (d.status !== 'claimed') {
                totalVal += Number(d.value);
                if (d.type === 'Cash') cashVal += Number(d.value);
                else itemCount++;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 6px;">${d.date}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${d.orNumber || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${d.benefactor}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${d.scholarshipType || 'General'}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${d.type}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">${d.description}</td>
                <td style="border: 1px solid #ddd; padding: 6px;">₱${Number(d.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            `;
            printTbody.appendChild(tr);
        });

        document.getElementById('print-timestamp').textContent = `Generated on: ${new Date().toLocaleString()}`;
        document.getElementById('print-total-val').textContent = `₱${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('print-cash-val').textContent = `₱${cashVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        document.getElementById('print-items-count').textContent = itemCount;

        const printContainer = document.getElementById('print-report-container');
        printContainer.style.display = 'block';
        window.print();
        printContainer.style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    DonationsModule.init();
});