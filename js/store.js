/* --- JS/STORE.JS --- */
/* The Central Data Layer: Handles Benefactors, User Auth, and JSON Import/Export */

const Store = {
    keys: {
        benefactors: "adzu_benefactors_data",
        users: "adzu_app_users",
        session: "adzu_current_user"
    },

    // ================= BENEFACTOR METHODS =================
    getBenefactors() {
        const data = localStorage.getItem(this.keys.benefactors);
        if (!data) {
            // Seed a sample default record if empty
            const initialBenefactors = [
                {
                    id: "b_1",
                    name: "Atty. Juan Dela Cruz",
                    organization: "Dela Cruz Law Partners",
                    email: "juandelacruz@example.com",
                    phone: "+639171234567",
                    birthday: "1985-08-04", // Set to today for instant testing
                    last_contacted_date: "2026-05-01",
                    notes: "Supports annual engineering scholarship grants.",
                    created_at: new Date().toISOString()
                }
            ];
            this.saveBenefactors(initialBenefactors);
            return initialBenefactors;
        }
        return JSON.parse(data);
    },

    saveBenefactors(benefactors) {
        localStorage.setItem(this.keys.benefactors, JSON.stringify(benefactors));
    },

    addBenefactor(formData) {
        const list = this.getBenefactors();
        const newRecord = {
            id: "b_" + Date.now(),
            ...formData,
            created_at: new Date().toISOString()
        };
        list.push(newRecord);
        this.saveBenefactors(list);
        return newRecord;
    },

    updateBenefactor(id, formData) {
        let list = this.getBenefactors();
        list = list.map(b => b.id === id ? { ...b, ...formData } : b);
        this.saveBenefactors(list);
    },

    deleteBenefactor(id) {
        let list = this.getBenefactors();
        list = list.filter(b => b.id !== id);
        this.saveBenefactors(list);
    },

    markContactedToday(id) {
        let list = this.getBenefactors();
        const todayStr = new Date().toISOString().split('T')[0];
        list = list.map(b => b.id === id ? { ...b, last_contacted_date: todayStr } : b);
        this.saveBenefactors(list);
    },

// ================= SINGLE ACCOUNT & AUTH METHODS =================
    getUsers() {
        // Enforce single system account storage
        const data = localStorage.getItem(this.keys.users);
        if (!data) {
            const defaultUser = { id: "u_admin", username: "admin", pin: "1234", created_at: new Date().toISOString() };
            localStorage.setItem(this.keys.users, JSON.stringify(defaultUser));
            return defaultUser;
        }
        return JSON.parse(data);
    },

    saveUser(userObj) {
        localStorage.setItem(this.keys.users, JSON.stringify(userObj));
    },

    login(username, pin) {
        const user = this.getUsers();
        if (user.username === username && user.pin === pin) {
            localStorage.setItem(this.keys.session, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: "Invalid username or PIN code." };
    },

    getCurrentUser() {
        const session = localStorage.getItem(this.keys.session);
        return session ? JSON.parse(session) : null;
    },

    logout() {
        localStorage.removeItem(this.keys.session);
    },

    updateAccount(username, pin) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, message: "Active session required." };
        
        const updated = { ...currentUser, username, pin };
        this.saveUser(updated);
        localStorage.setItem(this.keys.session, JSON.stringify(updated));
        return { success: true, message: "Credentials updated successfully." };
    },

    // ================= BACKUP IMPORT / EXPORT =================
    exportDatabase() {
        const payload = {
            app_name: "AdZUScholarBenefactorTracker",
            version: "1.0.0",
            exported_at: new Date().toISOString(),
            benefactors: this.getBenefactors(),
            users: this.getUsers()
        };
        const jsonString = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `adzu_benefactors_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importDatabase(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.benefactors && Array.isArray(parsed.benefactors)) {
                    this.saveBenefactors(parsed.benefactors);
                    if (parsed.users && Array.isArray(parsed.users)) {
                        this.saveUsers(parsed.users);
                    }
                    if (callback) callback(true, "Backup restored successfully.");
                } else {
                    if (callback) callback(false, "Invalid backup schema format.");
                }
            } catch (err) {
                if (callback) callback(false, "Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
    },

    // ================= DONATION SECTION =================
    getDonations() {
        const data = localStorage.getItem('adzu_donations');
        return data ? JSON.parse(data) : []; // Returns an empty array if blank instead of seeding demo data
    },

    saveDonation(donation) {
        const donations = this.getDonations();
        const existingIndex = donations.findIndex(d => d.id === donation.id);

        if (existingIndex > -1) {
            // Update existing record if editing
            donations[existingIndex] = { ...donations[existingIndex], ...donation };
        } else {
            // Add new record
            donations.unshift({ id: 'd_' + Date.now(), status: 'active', ...donation });
        }
        localStorage.setItem('adzu_donations', JSON.stringify(donations));
    },

    updateDonation(id, donationData) {
        let donations = this.getDonations();
        donations = donations.map(d => d.id === id ? { ...d, ...donationData } : d);
        localStorage.setItem('adzu_donations', JSON.stringify(donations));
    },

    updateDonationStatus(id, status, claimedDate = null) {
            let donations = this.getDonations();
            donations = donations.map(d => d.id === id ? { ...d, status, claimedDate } : d);
            localStorage.setItem('adzu_donations', JSON.stringify(donations));
    }
};