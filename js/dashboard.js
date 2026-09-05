/* --- JS/DASHBOARD.CSS / DASHBOARD.JS --- */
/* Dashboard Logic: Renders Today's Milestones (Birthdays) & Inactivity Follow-up Cards */

const Dashboard = {
    init() {
        this.renderMilestones();
        this.renderInactivityTracker();
    },

    // Check birthdays matching today's Month and Day (ignoring year)
    renderMilestones() {
        const container = document.getElementById("birthday-list");
        const benefactors = Store.getBenefactors();
        
        const today = new Date();
        const currentMonthDay = String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');

        const birthdayBabies = benefactors.filter(b => {
            if (!b.birthday) return false;
            // Extract MM-DD from YYYY-MM-DD
            const bMonthDay = b.birthday.split('-').slice(1).join('-');
            return bMonthDay === currentMonthDay;
        });

        if (birthdayBabies.length === 0) {
            container.innerHTML = `<p class="text-muted">No benefactor birthdays recorded for today.</p>`;
            return;
        }

        container.innerHTML = "";
        birthdayBabies.forEach(b => {
            const card = document.createElement("div");
            card.className = "alert-card birthday";
            
            // Pre-fill email and SMS drafts for the 365 Donation Drive
            const emailSubject = encodeURIComponent("Happy Birthday from AdZU Scholars & 365 Donation Drive!");
            const emailBody = encodeURIComponent(`Dear ${b.name},\n\nWishing you a wonderful and blessed birthday! As part of our AdZu birthday scholarship fund and the 365 donation drive, we wanted to touch base and see if you would like to contribute a small something for our campus scholars today.\n\nWarm regards,\nAdmissions Office`);
            const smsText = encodeURIComponent(`Happy Birthday, ${b.name}! From the AdZU 365 Donation Drive scholars. If you wish to donate today, please let us know!`);

            card.innerHTML = `
                <div class="alert-card-header">
                    <span class="alert-card-title">${b.name}</span>
                    <span class="badge-offline" style="background-color: var(--accent-gold); color: #000;">Birthday Today</span>
                </div>
                <div class="alert-card-meta">${b.organization || 'Independent Benefactor'} | Born: ${b.birthday}</div>
                <p style="font-size: 13px; margin-bottom: 8px;">Prompt: Invite to support the AdZU birthday scholarship fund / 365 donation drive.</p>
                <div class="alert-actions">
                    <a href="mailto:${b.email || ''}?subject=${emailSubject}&body=${emailBody}" class="btn btn-primary" target="_blank">Draft Email</a>
                    <a href="sms:${b.phone || ''}?body=${smsText}" class="btn btn-outline">Draft SMS</a>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Check benefactors who haven't been updated/contacted in over 45 days
    renderInactivityTracker() {
        const container = document.getElementById("inactivity-list");
        const benefactors = Store.getBenefactors();
        
        const today = new Date();
        const thresholdDays = 45;

        const inactiveList = benefactors.filter(b => {
            if (!b.last_contacted_date) return true;
            const lastContact = new Date(b.last_contacted_date);
            const diffTime = Math.abs(today - lastContact);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            b._calculatedDays = diffDays; // attach for rendering
            return diffDays > thresholdDays;
        });

        if (inactiveList.length === 0) {
            container.innerHTML = `<p class="text-muted">All benefactor records are up to date (within ${thresholdDays} days).</p>`;
            return;
        }

        container.innerHTML = "";
        inactiveList.forEach(b => {
            const card = document.createElement("div");
            card.className = "alert-card warning";

            card.innerHTML = `
                <div class="alert-card-header">
                    <span class="alert-card-title">${b.name}</span>
                    <span class="badge-offline" style="background-color: var(--accent-red); color: #fff;">${b._calculatedDays || '45+'} Days Inactive</span>
                </div>
                <div class="alert-card-meta">${b.organization || 'Independent'} | Last Contacted: ${b.last_contacted_date || 'Never'}</div>
                <div class="alert-actions">
                    <button class="btn btn-primary" onclick="Dashboard.handleLogContact('${b.id}')">Log Contact Today</button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    handleLogContact(id) {
        Store.markContactedToday(id);
        // Refresh dashboard views
        this.init();
    }
};