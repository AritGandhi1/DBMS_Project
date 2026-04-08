const AdminRoomsPage = {
  id: "admin-rooms",

  rooms: [],

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  async render() {
    return `
      <div class="container admin-users-page">
        <section class="card admin-users-hero">
          <div>
            <p class="admin-users-kicker">Administration</p>
            <h2 class="card-title admin-users-title">Room Management</h2>
            <p class="admin-users-subtitle">Create, edit, and remove rooms used for timetable scheduling.</p>
          </div>
          <div class="admin-users-stats" id="adminRoomStats"></div>
        </section>

        <div id="adminRoomsMessage"></div>

        <section class="card admin-users-panel">
          <div class="admin-users-panel-header">
            <div class="card-title admin-users-section-title">Add Room</div>
            <span class="admin-users-badge">Room Master</span>
          </div>
          <form id="adminAddRoomForm">
            <div class="card-grid admin-users-grid-tight">
              <div class="form-group"><label for="adminRoomId">Room ID</label><input id="adminRoomId" required /></div>
              <div class="form-group"><label for="adminRoomCapacity">Capacity</label><input id="adminRoomCapacity" type="number" min="1" required /></div>
              <div class="form-group"><label for="adminRoomBuilding">Building</label><input id="adminRoomBuilding" required /></div>
            </div>
            <button class="btn btn-primary" type="submit">Add Room</button>
          </form>
        </section>

        <section class="card admin-users-panel">
          <div class="admin-users-table-header">
            <div class="card-title admin-users-section-title">Rooms</div>
            <input id="adminRoomsSearch" class="admin-users-search" placeholder="Search by room ID or building" />
          </div>
          <div id="adminRoomsTable"></div>
        </section>
      </div>
    `;
  },

  renderStats(statsEl) {
    statsEl.innerHTML = `
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Rooms</div>
        <div class="admin-users-stat-value">${this.rooms.length}</div>
      </div>
    `;
  },

  renderRoomsTable(roomsTableEl, query) {
    const normalizedQuery = (query || "").trim().toLowerCase();
    const filteredRooms = normalizedQuery
      ? this.rooms.filter((room) => [
          room.roomId,
          room.building
        ].some((field) => String(field || "").toLowerCase().includes(normalizedQuery)))
      : this.rooms;

    roomsTableEl.innerHTML = filteredRooms.length
      ? `
        <div class="admin-users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room ID</th><th>Capacity</th><th>Building</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRooms.map((room) => {
                const roomId = this.escapeHtml(room.roomId);
                return `
                  <tr>
                    <td><input data-room-field="roomId" data-room-id="${roomId}" value="${roomId}" /></td>
                    <td><input data-room-field="capacity" data-room-id="${roomId}" type="number" min="1" value="${this.escapeHtml(room.capacity || "")}" /></td>
                    <td><input data-room-field="building" data-room-id="${roomId}" value="${this.escapeHtml(room.building || "")}" /></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary" data-room-update="${roomId}" type="button">Update</button>
                        <button class="btn btn-danger" data-room-delete="${roomId}" type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message info">No rooms match this search.</div>';
  },

  bindTableActions(roomsTableEl, setMessage, load) {
    roomsTableEl.querySelectorAll("button[data-room-update]").forEach((button) => {
      button.addEventListener("click", async () => {
        const roomId = button.dataset.roomUpdate;
        const row = button.closest("tr");
        const getValue = (field) => row?.querySelector(`[data-room-field="${field}"]`)?.value;

        try {
          await API.updateAdminRoom(roomId, {
            roomId: (getValue("roomId") || "").trim(),
            capacity: getValue("capacity"),
            building: (getValue("building") || "").trim()
          });

          setMessage("success", `Room ${roomId} updated successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message || "Failed to update room");
        }
      });
    });

    roomsTableEl.querySelectorAll("button[data-room-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const roomId = button.dataset.roomDelete;
        const confirmed = window.confirm(`Delete room ${roomId}? This cannot be undone.`);
        if (!confirmed) {
          return;
        }

        try {
          await API.deleteAdminRoom(roomId);
          setMessage("success", `Room ${roomId} deleted successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message || "Failed to delete room");
        }
      });
    });
  },

  refreshView(roomsTableEl, statsEl, searchEl, setMessage, load) {
    this.renderStats(statsEl);
    this.renderRoomsTable(roomsTableEl, searchEl.value);
    this.bindTableActions(roomsTableEl, setMessage, load);
  },

  async mount() {
    const messageEl = document.getElementById("adminRoomsMessage");
    const roomsTableEl = document.getElementById("adminRoomsTable");
    const addRoomForm = document.getElementById("adminAddRoomForm");
    const statsEl = document.getElementById("adminRoomStats");
    const searchEl = document.getElementById("adminRoomsSearch");

    const setMessage = (type, text) => {
      messageEl.innerHTML = text ? `<div class="message ${type}">${this.escapeHtml(text)}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getAdminRooms();
        this.rooms = data.rooms || [];
        this.refreshView(roomsTableEl, statsEl, searchEl, setMessage, load);
      } catch (error) {
        roomsTableEl.innerHTML = "";
        statsEl.innerHTML = "";
        setMessage("error", error.message || "Failed to load room data");
      }
    };

    searchEl.addEventListener("input", () => {
      this.renderRoomsTable(roomsTableEl, searchEl.value);
      this.bindTableActions(roomsTableEl, setMessage, load);
    });

    addRoomForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        await API.createAdminRoom({
          roomId: document.getElementById("adminRoomId").value.trim(),
          capacity: Number(document.getElementById("adminRoomCapacity").value),
          building: document.getElementById("adminRoomBuilding").value.trim()
        });

        addRoomForm.reset();
        setMessage("success", "Room added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message || "Failed to add room");
      }
    });

    await load();
  }
};
