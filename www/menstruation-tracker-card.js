/**
 * Menstruation Tracker Card for Home Assistant
 * Custom Lovelace card for tracking menstrual cycles with parent mode and notification settings
 */

class MenstruationTrackerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedUser = null;
    this.parentMode = false;
  }

  setConfig(config) {
    if (!config.entity && !config.parent_mode) {
      throw new Error('Please define an entity or enable parent_mode');
    }
    this.config = config;
    this.parentMode = config.parent_mode || false;
    this.childEntities = config.child_entities || [];
  }

  set hass(hass) {
    this._hass = hass;
    
    if (!this.content) {
      this.content = document.createElement('ha-card');
      this.content.innerHTML = `
        <style>
          .card-content {
            padding: 16px;
          }
          .parent-selector {
            margin-bottom: 16px;
            padding: 12px;
            background: var(--primary-background-color);
            border-radius: 8px;
            border: 1px solid var(--divider-color);
          }
          .selector-label {
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
          }
          .user-tabs {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .user-tab {
            padding: 8px 16px;
            border-radius: 16px;
            border: 2px solid var(--divider-color);
            background: var(--card-background-color);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .user-tab:hover {
            background: var(--primary-background-color);
          }
          .user-tab.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }
          .parent-badge {
            display: inline-block;
            background: #673ab7;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-left: 4px;
            font-weight: 500;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .user-name {
            font-size: 24px;
            font-weight: 500;
          }
          .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
          }
          .status-in-period {
            background: #f44336;
            color: white;
          }
          .status-not-in-period {
            background: #4caf50;
            color: white;
          }
          .status-no-data {
            background: #9e9e9e;
            color: white;
          }
          .main-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .info-card {
            background: var(--primary-background-color);
            border-radius: 8px;
            padding: 12px;
            border: 1px solid var(--divider-color);
          }
          .info-label {
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 24px;
            font-weight: 500;
            color: var(--primary-text-color);
          }
          .info-subtext {
            font-size: 11px;
            color: var(--secondary-text-color);
            margin-top: 2px;
          }
          .cycle-visualization {
            margin: 20px 0;
            position: relative;
          }
          .cycle-bar {
            height: 40px;
            background: linear-gradient(90deg, #e3f2fd 0%, #90caf9 50%, #e3f2fd 100%);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
          }
          .cycle-indicator {
            position: absolute;
            height: 100%;
            background: #f44336;
            border-radius: 20px 0 0 20px;
          }
          .ovulation-marker {
            position: absolute;
            width: 4px;
            height: 100%;
            background: #ff9800;
            top: 0;
          }
          .cycle-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            font-size: 11px;
            color: var(--secondary-text-color);
          }
          .fertility-window {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 12px;
            border-radius: 4px;
            margin: 16px 0;
          }
          .fertility-title {
            font-weight: 500;
            margin-bottom: 8px;
            color: #f57c00;
          }
          .fertility-dates {
            font-size: 13px;
            color: var(--primary-text-color);
          }
          .statistics {
            margin: 20px 0;
          }
          .stats-title {
            font-weight: 500;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .stat-item {
            text-align: center;
            padding: 8px;
            background: var(--primary-background-color);
            border-radius: 4px;
            border: 1px solid var(--divider-color);
          }
          .stat-value {
            font-size: 18px;
            font-weight: 500;
            color: var(--primary-text-color);
          }
          .stat-label {
            font-size: 10px;
            color: var(--secondary-text-color);
            margin-top: 2px;
          }
          .actions {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            flex-wrap: wrap;
          }
          .action-button {
            flex: 1;
            min-width: 120px;
            padding: 10px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          .action-button-primary {
            background: var(--primary-color);
            color: white;
          }
          .action-button-primary:hover {
            opacity: 0.9;
          }
          .action-button-secondary {
            background: var(--primary-background-color);
            color: var(--primary-text-color);
            border: 1px solid var(--divider-color);
          }
          .action-button-secondary:hover {
            background: var(--secondary-background-color);
          }
          .action-button-edit {
            background: #673ab7;
            color: white;
          }
          .action-button-edit:hover {
            background: #5e35b1;
          }
          .action-button-notifications {
            background: #2196f3;
            color: white;
          }
          .action-button-notifications:hover {
            background: #1976d2;
          }
          .symptoms {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--divider-color);
          }
          .symptom-item {
            padding: 6px 0;
            font-size: 13px;
            color: var(--secondary-text-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .symptom-date {
            font-weight: 500;
            color: var(--primary-text-color);
          }
          .symptom-delete {
            color: #f44336;
            cursor: pointer;
            padding: 4px 8px;
            font-size: 11px;
          }
          .symptom-delete:hover {
            background: #ffebee;
            border-radius: 4px;
          }
          .prediction-confidence {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 500;
            margin-left: 8px;
          }
          .confidence-high {
            background: #c8e6c9;
            color: #2e7d32;
          }
          .confidence-medium {
            background: #fff9c4;
            color: #f57f17;
          }
          .confidence-low {
            background: #ffccbc;
            color: #d84315;
          }
          .edit-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: var(--card-background-color);
            padding: 24px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
          }
          .modal-title {
            font-size: 18px;
            font-weight: 500;
            margin-bottom: 16px;
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-label {
            display: block;
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-bottom: 4px;
          }
          .form-input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--primary-background-color);
            color: var(--primary-text-color);
            font-size: 14px;
            box-sizing: border-box;
          }
          .form-select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--primary-background-color);
            color: var(--primary-text-color);
            font-size: 14px;
            box-sizing: border-box;
          }
          .form-buttons {
            display: flex;
            gap: 8px;
            margin-top: 20px;
          }
          .parent-mode-indicator {
            background: #673ab7;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            text-align: center;
            margin-bottom: 12px;
            font-weight: 500;
          }
          .notification-section {
            background: var(--primary-background-color);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid var(--divider-color);
          }
          .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .notification-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .toggle-switch {
            position: relative;
            width: 44px;
            height: 24px;
            background: #ccc;
            border-radius: 12px;
            cursor: pointer;
            transition: background 0.3s;
          }
          .toggle-switch.active {
            background: var(--primary-color);
          }
          .toggle-slider {
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: transform 0.3s;
          }
          .toggle-switch.active .toggle-slider {
            transform: translateX(20px);
          }
          .notification-settings {
            display: none;
          }
          .notification-settings.active {
            display: block;
          }
          .device-list {
            margin-top: 12px;
          }
          .device-item {
            display: flex;
            align-items: center;
            padding: 8px;
            margin: 4px 0;
            background: var(--card-background-color);
            border-radius: 4px;
            border: 1px solid var(--divider-color);
          }
          .device-checkbox {
            margin-right: 8px;
          }
          .device-name {
            flex: 1;
            font-size: 13px;
          }
          .notification-type {
            margin: 12px 0;
            padding: 12px;
            background: var(--card-background-color);
            border-radius: 4px;
            border-left: 3px solid var(--primary-color);
          }
          .notification-type-title {
            font-weight: 500;
            font-size: 13px;
            margin-bottom: 8px;
          }
          .notification-option {
            display: flex;
            align-items: center;
            margin: 6px 0;
            font-size: 12px;
          }
          .notification-option input {
            margin-right: 8px;
          }
          .days-before-input {
            width: 50px;
            padding: 4px;
            margin-left: 8px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--primary-background-color);
            color: var(--primary-text-color);
          }
        </style>
        <div class="card-content">
          <div id="parent-selector"></div>
          <div id="parent-mode-indicator"></div>
          <div class="header">
            <div class="user-name" id="user-name"></div>
            <div class="status-badge" id="status-badge"></div>
          </div>
          <div id="main-content"></div>
        </div>
        <div id="modal-container"></div>
      `;
      this.shadowRoot.appendChild(this.content);
    }

    if (this.parentMode) {
      this.renderParentSelector();
      if (!this.selectedUser && this.childEntities.length > 0) {
        this.selectedUser = this.childEntities[0];
      }
    }

    const entityId = this.parentMode ? this.selectedUser : this.config.entity;
    const entity = entityId ? hass.states[entityId] : null;

    if (!entity) {
      this.content.querySelector('#main-content').innerHTML = 
        '<div style="padding: 20px; text-align: center;">Entity not found or no user selected</div>';
      return;
    }

    this.updateCard(entity);
  }

  renderParentSelector() {
    const selectorHtml = `
      <div class="parent-selector">
        <div class="selector-label">👨‍👩‍👧 Select User to Manage</div>
        <div class="user-tabs">
          ${this.childEntities.map(entityId => {
            const entity = this._hass.states[entityId];
            const userName = entityId.split('.')[1]
              .replace('menstruation_tracker_', '')
              .replace(/_/g, ' ');
            const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
            const isActive = entityId === this.selectedUser;
            const state = entity ? entity.state : 'Unknown';
            const stateIcon = state === 'In Period' ? '🔴' : state === 'Not in Period' ? '🟢' : '⚪';
            
            return `
              <div class="user-tab ${isActive ? 'active' : ''}" 
                   data-entity="${entityId}"
                   onclick="this.getRootNode().host.selectUser('${entityId}')">
                ${stateIcon} ${displayName}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    this.content.querySelector('#parent-selector').innerHTML = selectorHtml;
    
    const indicator = `
      <div class="parent-mode-indicator">
        👨‍👩‍👧 PARENT MODE - Managing data for selected user
      </div>
    `;
    this.content.querySelector('#parent-mode-indicator').innerHTML = indicator;
  }

  selectUser(entityId) {
    this.selectedUser = entityId;
    const entity = this._hass.states[entityId];
    if (entity) {
      this.renderParentSelector();
      this.updateCard(entity);
    }
  }

  updateCard(entity) {
    const state = entity.state;
    const attrs = entity.attributes;
    
    const userName = entity.entity_id.split('.')[1].replace('menstruation_tracker_', '').replace(/_/g, ' ');
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
    this.content.querySelector('#user-name').innerHTML = 
      displayName + (this.parentMode ? '<span class="parent-badge">MANAGED</span>' : '');
    
    const statusBadge = this.content.querySelector('#status-badge');
    statusBadge.textContent = state;
    statusBadge.className = 'status-badge status-' + state.toLowerCase().replace(/ /g, '-');

    let mainContent = '';

    if (state !== 'No Data' && state !== 'No Cycles Logged') {
      mainContent += '<div class="main-info">';
      
      if (attrs.days_until_next_period !== undefined) {
        const daysUntil = attrs.days_until_next_period;
        const daysText = daysUntil === 0 ? 'Today' : 
                        daysUntil === 1 ? '1 day' : 
                        daysUntil < 0 ? `${Math.abs(daysUntil)} days late` :
                        `${daysUntil} days`;
        mainContent += `
          <div class="info-card">
            <div class="info-label">Next Period</div>
            <div class="info-value">${daysText}</div>
            <div class="info-subtext">${attrs.next_period || 'Unknown'}</div>
          </div>
        `;
      }

      if (state === 'In Period' && attrs.days_in_current_period) {
        mainContent += `
          <div class="info-card">
            <div class="info-label">Period Day</div>
            <div class="info-value">${attrs.days_in_current_period}</div>
            <div class="info-subtext">Days in period</div>
          </div>
        `;
      } else if (attrs.average_cycle_length && attrs.days_until_next_period !== undefined) {
        const cycleDay = Math.round(attrs.average_cycle_length - attrs.days_until_next_period);
        mainContent += `
          <div class="info-card">
            <div class="info-label">Cycle Day</div>
            <div class="info-value">${cycleDay > 0 ? cycleDay : '—'}</div>
            <div class="info-subtext">of ${Math.round(attrs.average_cycle_length)}</div>
          </div>
        `;
      }
      
      mainContent += '</div>';

      if (attrs.average_cycle_length && attrs.days_until_next_period !== undefined) {
        const cycleDay = Math.round(attrs.average_cycle_length - attrs.days_until_next_period);
        const periodWidth = (5 / attrs.average_cycle_length) * 100;
        const ovulationDay = attrs.average_cycle_length - 14;
        const ovulationPosition = (ovulationDay / attrs.average_cycle_length) * 100;
        
        mainContent += `
          <div class="cycle-visualization">
            <div class="cycle-bar">
              ${state === 'In Period' ? `<div class="cycle-indicator" style="width: ${periodWidth}%"></div>` : ''}
              <div class="ovulation-marker" style="left: ${ovulationPosition}%"></div>
            </div>
            <div class="cycle-labels">
              <span>Day 1</span>
              <span>Ovulation ~Day ${Math.round(ovulationDay)}</span>
              <span>Day ${Math.round(attrs.average_cycle_length)}</span>
            </div>
          </div>
        `;
      }

      if (attrs.confidence) {
        mainContent += `
          <div style="text-align: center; margin: 16px 0;">
            <span style="color: var(--secondary-text-color); font-size: 13px;">Prediction Confidence:</span>
            <span class="prediction-confidence confidence-${attrs.confidence}">${attrs.confidence.toUpperCase()}</span>
          </div>
        `;
      }

      if (attrs.fertility_window) {
        const fertility = attrs.fertility_window;
        mainContent += `
          <div class="fertility-window">
            <div class="fertility-title">🌸 Fertility Window (NFP)</div>
            <div class="fertility-dates">
              <strong>Ovulation:</strong> ${fertility.ovulation_date}<br>
              <strong>Fertile Period:</strong> ${fertility.fertile_window_start} to ${fertility.fertile_window_end}
            </div>
          </div>
        `;
      }

      if (attrs.statistics) {
        const stats = attrs.statistics;
        mainContent += `
          <div class="statistics">
            <div class="stats-title">📊 Cycle Statistics</div>
            <div class="stats-grid">
              ${stats.average_cycle ? `
                <div class="stat-item">
                  <div class="stat-value">${stats.average_cycle}</div>
                  <div class="stat-label">Avg Cycle</div>
                </div>
              ` : ''}
              ${stats.average_period_length ? `
                <div class="stat-item">
                  <div class="stat-value">${stats.average_period_length}</div>
                  <div class="stat-label">Avg Period</div>
                </div>
              ` : ''}
              ${stats.total_cycles ? `
                <div class="stat-item">
                  <div class="stat-value">${stats.total_cycles}</div>
                  <div class="stat-label">Total Cycles</div>
                </div>
              ` : ''}
              ${stats.shortest_cycle ? `
                <div class="stat-item">
                  <div class="stat-value">${stats.shortest_cycle}</div>
                  <div class="stat-label">Shortest</div>
                </div>
              ` : ''}
              ${stats.longest_cycle ? `
                <div class="stat-item">
                  <div class="stat-value">${stats.longest_cycle}</div>
                  <div class="stat-label">Longest</div>
                </div>
              ` : ''}
              ${attrs.cycle_variability !== undefined ? `
                <div class="stat-item">
                  <div class="stat-value">±${attrs.cycle_variability}</div>
                  <div class="stat-label">Variability</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }

      if (attrs.recent_symptoms && attrs.recent_symptoms.length > 0) {
        mainContent += '<div class="symptoms"><div class="stats-title">Recent Symptoms</div>';
        attrs.recent_symptoms.reverse().forEach((symptom, index) => {
          mainContent += `
            <div class="symptom-item">
              <div>
                <span class="symptom-date">${symptom.date}:</span> ${symptom.symptom}
                ${symptom.notes ? ` - ${symptom.notes}` : ''}
              </div>
              ${this.parentMode ? `<span class="symptom-delete" onclick="this.getRootNode().host.deleteSymptom(${index})">🗑️</span>` : ''}
            </div>
          `;
        });
        mainContent += '</div>';
      }
    }

    const user = entity.entity_id.split('.')[1].replace('menstruation_tracker_', '');
    mainContent += `
      <div class="actions">
        ${state === 'In Period' ? `
          <button class="action-button action-button-primary" onclick="this.getRootNode().host.callService('log_period_end', '${user}')">
            End Period
          </button>
        ` : `
          <button class="action-button action-button-primary" onclick="this.getRootNode().host.callService('log_period_start', '${user}')">
            Start Period
          </button>
        `}
        <button class="action-button action-button-secondary" onclick="this.getRootNode().host.callService('log_symptom', '${user}')">
          Log Symptom
        </button>
        <button class="action-button action-button-notifications" onclick="this.getRootNode().host.showNotificationSettings('${user}')">
          🔔 Notifications
        </button>
        ${this.parentMode ? `
          <button class="action-button action-button-edit" onclick="this.getRootNode().host.showEditModal('${user}')">
            ✏️ Edit Data
          </button>
          <button class="action-button action-button-secondary" onclick="this.getRootNode().host.addPastCycle('${user}')">
            + Past Cycle
          </button>
        ` : ''}
      </div>
    `;

    this.content.querySelector('#main-content').innerHTML = mainContent;
  }

  async showNotificationSettings(user) {
    // Get available notify services
    const services = this._hass.services.notify || {};
    const notifyServices = Object.keys(services).filter(s => s !== 'persistent_notification');
    
    const modalHtml = `
      <div class="edit-modal" onclick="if(event.target === this) this.getRootNode().host.closeModal()">
        <div class="modal-content">
          <div class="modal-title">🔔 Notification Settings for ${user}</div>
          
          <div class="notification-section">
            <div class="notification-header">
              <span style="font-weight: 500;">Enable Notifications</span>
              <div class="notification-toggle">
                <div class="toggle-switch" id="master-toggle" onclick="this.getRootNode().host.toggleMasterNotifications()">
                  <div class="toggle-slider"></div>
                </div>
              </div>
            </div>
            
            <div class="notification-settings" id="notification-settings">
              <div class="form-group">
                <label class="form-label">Notification Time</label>
                <input type="time" class="form-input" id="notification-time" value="09:00">
                <div style="font-size: 11px; color: var(--secondary-text-color); margin-top: 4px;">
                  Time of day to receive notifications
                </div>
              </div>
            </div>
          </div>

          <div class="form-buttons">
            <button class="action-button action-button-secondary" style="flex: 1;" 
                    onclick="this.getRootNode().host.closeModal()">
              Cancel
            </button>
            <button class="action-button action-button-primary" style="flex: 1;" 
                    onclick="this.getRootNode().host.saveNotificationSettings('${user}')">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.content.querySelector('#modal-container').innerHTML = modalHtml;
    
    // Load existing settings from input_text entities if they exist
    this.loadNotificationSettings(user);
  }

  toggleMasterNotifications() {
    const toggle = this.shadowRoot.querySelector('#master-toggle');
    const settings = this.shadowRoot.querySelector('#notification-settings');
    
    toggle.classList.toggle('active');
    settings.classList.toggle('active');
  }

  async loadNotificationSettings(user) {
    // Try to load settings from Home Assistant input_text entities
    const settingsEntityId = `input_text.${user}_notification_settings`;
    const settingsEntity = this._hass.states[settingsEntityId];
    
    if (settingsEntity) {
      try {
        const settings = JSON.parse(settingsEntity.state);
        
        // Apply settings to UI
        if (settings.enabled) {
          this.shadowRoot.querySelector('#master-toggle').classList.add('active');
          this.shadowRoot.querySelector('#notification-settings').classList.add('active');
        }
        
        if (settings.devices) {
          settings.devices.forEach(device => {
            const checkbox = this.shadowRoot.querySelector(`input[value="${device}"]`);
            if (checkbox) checkbox.checked = true;
          });
        }
        
        if (settings.notifications) {
          Object.keys(settings.notifications).forEach(key => {
            const checkbox = this.shadowRoot.querySelector(`#${key}`);
            if (checkbox) checkbox.checked = settings.notifications[key];
          });
        }
        
        if (settings.daysBefore) {
          const input = this.shadowRoot.querySelector('#days-before-period');
          if (input) input.value = settings.daysBefore;
        }
        
        if (settings.daysLate) {
          const input = this.shadowRoot.querySelector('#days-late');
          if (input) input.value = settings.daysLate;
        }
        
        if (settings.daysRemindEnd) {
          const input = this.shadowRoot.querySelector('#days-remind-end');
          if (input) input.value = settings.daysRemindEnd;
        }
        
        if (settings.notificationTime) {
          const input = this.shadowRoot.querySelector('#notification-time');
          if (input) input.value = settings.notificationTime;
        }
      } catch (e) {
        console.log('No existing settings found or invalid format');
      }
    }
  }

  async saveNotificationSettings(user) {
    const enabled = this.shadowRoot.querySelector('#master-toggle').classList.contains('active');
    
    // Collect selected devices
    const deviceCheckboxes = this.shadowRoot.querySelectorAll('.device-checkbox:checked');
    const devices = Array.from(deviceCheckboxes).map(cb => cb.value);
    
    // Collect notification preferences
    const notifications = {
      'notify-period-upcoming': this.shadowRoot.querySelector('#notify-period-upcoming')?.checked || false,
      'notify-period-due': this.shadowRoot.querySelector('#notify-period-due')?.checked || false,
      'notify-period-late': this.shadowRoot.querySelector('#notify-period-late')?.checked || false,
      'notify-fertile-start': this.shadowRoot.querySelector('#notify-fertile-start')?.checked || false,
      'notify-ovulation': this.shadowRoot.querySelector('#notify-ovulation')?.checked || false,
      'notify-log-reminder': this.shadowRoot.querySelector('#notify-log-reminder')?.checked || false,
      'notify-end-reminder': this.shadowRoot.querySelector('#notify-end-reminder')?.checked || false,
    };
    
    const settings = {
      enabled: enabled,
      devices: devices,
      notifications: notifications,
      daysBefore: parseInt(this.shadowRoot.querySelector('#days-before-period')?.value || 2),
      daysLate: parseInt(this.shadowRoot.querySelector('#days-late')?.value || 3),
      daysRemindEnd: parseInt(this.shadowRoot.querySelector('#days-remind-end')?.value || 7),
      notificationTime: this.shadowRoot.querySelector('#notification-time')?.value || '09:00'
    };
    
    // Save to input_text helper (needs to be created manually in configuration.yaml)
    const settingsEntityId = `input_text.${user}_notification_settings`;
    
    try {
      await this._hass.callService('input_text', 'set_value', {
        entity_id: settingsEntityId,
        value: JSON.stringify(settings)
      });
      
      // Also call a service to update automations
      await this._hass.callService('menstruation_tracker', 'update_notifications', {
        user: user,
        settings: settings
      });
      
      alert('Notification settings saved successfully!');
      this.closeModal();
    } catch (e) {
      console.error('Error saving settings:', e);
      alert('To enable notifications, please add this to configuration.yaml:\n\ninput_text:\n  ' + user + '_notification_settings:\n    name: "' + user + ' Notification Settings"\n    max: 1000\n\nThen restart Home Assistant.');
    }
  }

  showEditModal(user) {
    const modalHtml = `
      <div class="edit-modal" onclick="if(event.target === this) this.getRootNode().host.closeModal()">
        <div class="modal-content">
          <div class="modal-title">Edit Cycle Data for ${user}</div>
          
          <div class="form-group">
            <label class="form-label">Log Period with Custom Date</label>
            <input type="date" class="form-input" id="custom-period-date">
            <button class="action-button action-button-primary" style="margin-top: 8px; width: 100%;" 
                    onclick="this.getRootNode().host.logPeriodWithDate('${user}', 'start')">
              Log Period Start
            </button>
            <button class="action-button action-button-secondary" style="margin-top: 4px; width: 100%;" 
                    onclick="this.getRootNode().host.logPeriodWithDate('${user}', 'end')">
              Log Period End
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Add Symptom with Custom Date</label>
            <input type="date" class="form-input" id="custom-symptom-date">
            <input type="text" class="form-input" id="symptom-text" placeholder="Symptom" style="margin-top: 4px;">
            <input type="text" class="form-input" id="symptom-notes" placeholder="Notes (optional)" style="margin-top: 4px;">
            <button class="action-button action-button-primary" style="margin-top: 8px; width: 100%;" 
                    onclick="this.getRootNode().host.logSymptomWithDate('${user}')">
              Log Symptom
            </button>
          </div>

          <div class="form-buttons">
            <button class="action-button action-button-secondary" style="flex: 1;" 
                    onclick="this.getRootNode().host.closeModal()">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
    this.content.querySelector('#modal-container').innerHTML = modalHtml;
    
    const today = new Date().toISOString().split('T')[0];
    this.shadowRoot.querySelector('#custom-period-date').value = today;
    this.shadowRoot.querySelector('#custom-symptom-date').value = today;
  }

  closeModal() {
    this.content.querySelector('#modal-container').innerHTML = '';
  }

  logPeriodWithDate(user, type) {
    const dateInput = this.shadowRoot.querySelector('#custom-period-date');
    const date = dateInput.value;
    
    if (!date) {
      alert('Please select a date');
      return;
    }

    const service = type === 'start' ? 'log_period_start' : 'log_period_end';
    this._hass.callService('menstruation_tracker', service, {
      user: user,
      date: date
    });
    
    this.closeModal();
  }

  logSymptomWithDate(user) {
    const dateInput = this.shadowRoot.querySelector('#custom-symptom-date');
    const symptomInput = this.shadowRoot.querySelector('#symptom-text');
    const notesInput = this.shadowRoot.querySelector('#symptom-notes');
    
    const date = dateInput.value;
    const symptom = symptomInput.value;
    const notes = notesInput.value;
    
    if (!date || !symptom) {
      alert('Please fill in date and symptom');
      return;
    }

    this._hass.callService('menstruation_tracker', 'log_symptom', {
      user: user,
      date: date,
      symptom: symptom,
      notes: notes
    });
    
    this.closeModal();
  }

  addPastCycle(user) {
    const startDate = prompt('Enter cycle start date (YYYY-MM-DD):');
    if (!startDate) return;
    
    const endDate = prompt('Enter period end date (YYYY-MM-DD):');
    if (!endDate) return;
    
    this._hass.callService('menstruation_tracker', 'log_period_start', {
      user: user,
      date: startDate
    });
    
    setTimeout(() => {
      this._hass.callService('menstruation_tracker', 'log_period_end', {
        user: user,
        date: endDate
      });
    }, 500);
  }

  deleteSymptom(index) {
    if (confirm('Delete this symptom entry?')) {
      alert('Delete symptom functionality requires backend service implementation');
    }
  }

  callService(service, user) {
    if (service === 'log_symptom') {
      const symptom = prompt('Enter symptom:');
      if (symptom) {
        const notes = prompt('Notes (optional):') || '';
        this._hass.callService('menstruation_tracker', 'log_symptom', {
          user: user,
          symptom: symptom,
          notes: notes
        });
      }
    } else if (service === 'log_period_start') {
      if (confirm('Start period today?')) {
        this._hass.callService('menstruation_tracker', 'log_period_start', {
          user: user
        });
      }
    } else if (service === 'log_period_end') {
      if (confirm('End period today?')) {
        this._hass.callService('menstruation_tracker', 'log_period_end', {
          user: user
        });
      }
    }
  }

  getCardSize() {
    return this.parentMode ? 8 : 6;
  }

  static getConfigElement() {
    return document.createElement('menstruation-tracker-card-editor');
  }

  static getStubConfig() {
    return { 
      entity: 'sensor.menstruation_tracker_user1',
      parent_mode: false,
      child_entities: []
    };
  }
}

customElements.define('menstruation-tracker-card', MenstruationTrackerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'menstruation-tracker-card',
  name: 'Menstruation Tracker Card',
  description: 'A beautiful card for tracking menstrual cycles with parent mode and notifications'
});

console.info(
  '%c MENSTRUATION-TRACKER-CARD %c Version 2.1.0 ',
  'color: white; background: #f44336; font-weight: 700;',
  'color: white; background: #9c27b0; font-weight: 700;'
);
                <label class="form-label">Select Notification Devices/Services</label>
                <div class="device-list" id="device-list">
                  ${notifyServices.length > 0 ? notifyServices.map(service => `
                    <div class="device-item">
                      <input type="checkbox" class="device-checkbox" value="notify.${service}" id="device-${service}">
                      <label for="device-${service}" class="device-name">${service}</label>
                    </div>
                  `).join('') : '<p style="font-size: 12px; color: var(--secondary-text-color);">No notification services found. Please set up mobile_app or other notify services.</p>'}
                </div>
              </div>

              <div class="notification-type">
                <div class="notification-type-title">📅 Period Reminders</div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-period-upcoming" checked>
                  <label for="notify-period-upcoming">
                    Remind 
                    <input type="number" class="days-before-input" id="days-before-period" value="2" min="1" max="7">
                    days before expected period
                  </label>
                </div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-period-due">
                  <label for="notify-period-due">Notify on expected period day</label>
                </div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-period-late">
                  <label for="notify-period-late">Alert if period is 
                    <input type="number" class="days-before-input" id="days-late" value="3" min="1" max="10">
                    days late
                  </label>
                </div>
              </div>

              <div class="notification-type">
                <div class="notification-type-title">🌸 Fertility Window</div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-fertile-start">
                  <label for="notify-fertile-start">Notify when fertile window starts</label>
                </div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-ovulation">
                  <label for="notify-ovulation">Notify on expected ovulation day</label>
                </div>
              </div>

              <div class="notification-type">
                <div class="notification-type-title">📝 Tracking Reminders</div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-log-reminder">
                  <label for="notify-log-reminder">Daily reminder to log data (during period)</label>
                </div>
                <div class="notification-option">
                  <input type="checkbox" id="notify-end-reminder">
                  <label for="notify-end-reminder">Remind to log period end after 
                    <input type="number" class="days-before-input" id="days-remind-end" value="7" min="5" max="10">
                    days
                  </label>
                </div>
              </div>

              <div class="form-group">
