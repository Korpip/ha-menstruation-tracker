Menstruation Tracker for Home Assistant
A comprehensive menstruation tracking integration for Home Assistant with cycle predictions, NFP fertility tracking, parent/child management, and customizable notifications.
Features
✨ Cycle Tracking & Predictions

Automatic cycle predictions based on historical data
Confidence levels (high/medium/low) based on cycle regularity
Statistics: average cycle length, shortest/longest cycles, period length

🌸 Natural Family Planning (NFP)

Fertility window calculations
Ovulation date predictions
Scientifically-based tracking

👨‍👩‍👧 Multi-User & Parent Mode

Support for multiple users
Parent access to manage children's data
Individual settings per user

🔔 Customizable Notifications

Period reminders (upcoming, due, late)
Fertility window alerts
Daily tracking reminders
Device-specific notification routing
Enable/disable per notification type

📊 Beautiful Lovelace Card

Visual cycle progress bar
Real-time statistics
Symptom logging
Parent/child switching interface

💾 Data Management

Backup & restore functionality
Export to JSON
Import historical data

Installation
HACS Installation (Recommended)

Open HACS in your Home Assistant instance
Click on "Integrations"
Click the three dots in the top right corner
Select "Custom repositories"
Add this repository URL: https://github.com/Korpip/ha-menstruation-tracker
Select category "Integration"
Click "Add"
Find "Menstruation Tracker" in the integration list and click "Download"
Restart Home Assistant

Manual Installation

Download the latest release from GitHub
Copy the custom_components/menstruation_tracker folder to your Home Assistant custom_components directory
Copy www/menstruation-tracker-card.js to your www folder
Restart Home Assistant

Configuration
Step 1: Add to configuration.yaml
```
# Menstruation Tracker Integration
menstruation_tracker:
  users:
    - "user1"
    - "user2"
    - "daughter"

# Input text helpers for notification settings
input_text:
  user1_notification_settings:
    name: "User1 Notification Settings"
    max: 1000
  user2_notification_settings:
    name: "User2 Notification Settings"
    max: 1000
  daughter_notification_settings:
    name: "Daughter Notification Settings"
    max: 1000
# Lovelace resources
lovelace:
  mode: yaml
  resources:
    - url: /local/menstruation-tracker-card.js
      type: module
```

SKIP!!! Step 2: Add Automations
Copy the contents of examples/automations.yaml to your automations.yaml file, or create a separate package file:
```
# In configuration.yaml
homeassistant:
  packages:
    menstruation_tracker: !include packages/menstruation_tracker.yaml
```
Then create packages/menstruation_tracker.yaml with the automation content.
Step 3: Add Lovelace Card
Add the card to your dashboard:
Single User Card:
```
type: custom:menstruation-tracker-card
entity: sensor.menstruation_tracker_user1
```
Parent Mode Card:
```
type: custom:menstruation-tracker-card
parent_mode: true
child_entities:
  - sensor.menstruation_tracker_daughter1
  - sensor.menstruation_tracker_daughter2
```
Full Dashboard Example:
See examples/dashboard.yaml for a complete dashboard layout.
Step 4: Restart Home Assistant
Restart Home Assistant to load all components.
Usage
Logging Period Data
Via Card:

Click "Start Period" button when period begins
Click "End Period" button when period ends
Click "Log Symptom" to add symptoms or notes

Via Services:
```
# Start period
service: menstruation_tracker.log_period_start
data:
  user: "user1"
  date: "2025-01-15"  # Optional, defaults to today

# End period
service: menstruation_tracker.log_period_end
data:
  user: "user1"
  date: "2025-01-20"  # Optional

# Log symptom
service: menstruation_tracker.log_symptom
data:
  user: "user1"
  symptom: "Cramps"
  notes: "Mild discomfort"
  date: "2025-01-15"  # Optional
```
Setting Up Notifications

Click the "🔔 Notifications" button in the card
Toggle notifications ON
Select which devices should receive notifications
Choose notification types and timing
Click "Save Settings"

Backup & Restore
Backup:
```
service: menstruation_tracker.backup_data
data:
  backup_path: "/config/backups/menstruation_backup.json"
```
Restore:
```
service: menstruation_tracker.restore_data
data:
  backup_path: "/config/backups/menstruation_backup.json"
```
Parent Mode
Parents can:

Switch between children using the tab selector
View all statistics and predictions
Log data with custom dates (past or present)
Add historical cycle data
Configure notifications for children
Choose which devices receive alerts

Services
ServiceDescriptionParameterslog_period_startLog the start of a perioduser, date (optional)log_period_endLog the end of a perioduser, date (optional)log_symptomLog a symptom or noteuser, symptom, notes, datebackup_dataBackup all data to JSONbackup_pathrestore_dataRestore data from backupbackup_pathmodify_user_dataParent modification accessuser, target_userupdate_notificationsUpdate notification settingsuser, settings
Entity Attributes
Each user gets a sensor entity with these attributes:

state: Current status (In Period, Not in Period, No Data)
days_until_next_period: Days until predicted period
next_period: Predicted next period date
next_period_range: Range of likely dates
confidence: Prediction confidence (high/medium/low)
average_cycle_length: Average cycle length
cycle_variability: Standard deviation of cycle length
fertility_window: Object with ovulation and fertile dates
statistics: Object with cycle statistics
days_in_current_period: Current period day (if in period)
recent_symptoms: Array of recent symptom entries

Troubleshooting
Card Not Appearing

Verify the JavaScript file is in /config/www/
Clear browser cache (Ctrl+F5)
Check browser console for errors
Verify resource is added to Lovelace configuration

Notifications Not Working

Verify input_text helpers are created
Check automation conditions in automations
Ensure notification services are available
Review Home Assistant logs for errors

Sensors Not Updating

Restart Home Assistant
Check configuration.yaml for syntax errors
Verify users are listed in configuration
Check logs for component errors

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
License
MIT License - See LICENSE file for details
Support
For issues, questions, or suggestions:

GitHub Issues: Korpip/ha-menstruation-tracker/issues

Screenshots
[Add screenshots here]
Credits
Developed for the Home Assistant community with ❤️ and claude.ai
