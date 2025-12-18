"""Constants for menstruation_tracker."""
DOMAIN = "menstruation_tracker"
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.storage"

# Configuration
CONF_USERS = "users"

# Services
SERVICE_LOG_PERIOD_START = "log_period_start"
SERVICE_LOG_PERIOD_END = "log_period_end"
SERVICE_LOG_SYMPTOM = "log_symptom"
SERVICE_BACKUP_DATA = "backup_data"
SERVICE_RESTORE_DATA = "restore_data"
SERVICE_MODIFY_USER_DATA = "modify_user_data"
SERVICE_UPDATE_NOTIFICATIONS = "update_notifications"

# Attributes
ATTR_USER = "user"
ATTR_DATE = "date"
ATTR_SYMPTOM = "symptom"
ATTR_NOTES = "notes"
ATTR_BACKUP_PATH = "backup_path"
ATTR_TARGET_USER = "target_user"
ATTR_SETTINGS = "settings"
