"""
Home Assistant Menstruation Tracking Component
Tracks menstrual cycles with predictions, NFP fertility tracking, and multi-user support
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import json
import logging
from statistics import mean, stdev

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.const import CONF_NAME
import voluptuous as vol
import homeassistant.helpers.config_validation as cv
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)

DOMAIN = "menstruation_tracker"
STORAGE_VERSION = 1
STORAGE_KEY = f"{DOMAIN}.storage"

# Configuration
CONF_USERS = "users"
CONF_USER_ID = "user_id"
CONF_PARENT_ACCESS = "parent_access"

# Services
SERVICE_LOG_PERIOD_START = "log_period_start"
SERVICE_LOG_PERIOD_END = "log_period_end"
SERVICE_LOG_SYMPTOM = "log_symptom"
SERVICE_BACKUP_DATA = "backup_data"
SERVICE_RESTORE_DATA = "restore_data"
SERVICE_MODIFY_USER_DATA = "modify_user_data"

# Attributes
ATTR_USER = "user"
ATTR_DATE = "date"
ATTR_SYMPTOM = "symptom"
ATTR_NOTES = "notes"
ATTR_BACKUP_PATH = "backup_path"
ATTR_TARGET_USER = "target_user"

CONFIG_SCHEMA = vol.Schema({
    DOMAIN: vol.Schema({
        vol.Optional(CONF_USERS, default=[]): vol.All(cv.ensure_list, [cv.string]),
    })
}, extra=vol.ALLOW_EXTRA)


async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the Menstruation Tracker component."""
    conf = config.get(DOMAIN, {})
    
    # Initialize storage
    store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    data = await store.async_load() or {
        "users": {},
        "parent_access": {}
    }
    
    hass.data[DOMAIN] = {
        "store": store,
        "data": data,
        "trackers": {}
    }
    
    # Create trackers for configured users
    for user in conf.get(CONF_USERS, []):
        if user not in data["users"]:
            data["users"][user] = {
                "cycles": [],
                "symptoms": [],
                "settings": {
                    "average_cycle_length": 28,
                    "average_period_length": 5,
                    "reminders_enabled": True
                }
            }
    
    await store.async_save(data)
    
    # Register services
    async def log_period_start(call: ServiceCall):
        """Log the start of a period."""
        user = call.data[ATTR_USER]
        date_str = call.data.get(ATTR_DATE, datetime.now().date().isoformat())
        
        if user not in hass.data[DOMAIN]["data"]["users"]:
            hass.data[DOMAIN]["data"]["users"][user] = {
                "cycles": [],
                "symptoms": [],
                "settings": {
                    "average_cycle_length": 28,
                    "average_period_length": 5,
                    "reminders_enabled": True
                }
            }
        
        cycle = {
            "start_date": date_str,
            "end_date": None,
            "cycle_length": None
        }
        
        hass.data[DOMAIN]["data"]["users"][user]["cycles"].append(cycle)
        await hass.data[DOMAIN]["store"].async_save(hass.data[DOMAIN]["data"])
        
        # Update sensor
        if user in hass.data[DOMAIN]["trackers"]:
            await hass.data[DOMAIN]["trackers"][user].async_update_ha_state(force_refresh=True)
        
        _LOGGER.info(f"Logged period start for {user} on {date_str}")
    
    async def log_period_end(call: ServiceCall):
        """Log the end of a period."""
        user = call.data[ATTR_USER]
        date_str = call.data.get(ATTR_DATE, datetime.now().date().isoformat())
        
        if user in hass.data[DOMAIN]["data"]["users"]:
            cycles = hass.data[DOMAIN]["data"]["users"][user]["cycles"]
            if cycles and cycles[-1]["end_date"] is None:
                cycles[-1]["end_date"] = date_str
                
                # Calculate cycle length if there's a previous cycle
                if len(cycles) > 1:
                    start = datetime.fromisoformat(cycles[-1]["start_date"])
                    prev_start = datetime.fromisoformat(cycles[-2]["start_date"])
                    cycles[-1]["cycle_length"] = (start - prev_start).days
                
                await hass.data[DOMAIN]["store"].async_save(hass.data[DOMAIN]["data"])
                
                # Update sensor
                if user in hass.data[DOMAIN]["trackers"]:
                    await hass.data[DOMAIN]["trackers"][user].async_update_ha_state(force_refresh=True)
                
                _LOGGER.info(f"Logged period end for {user} on {date_str}")
    
    async def log_symptom(call: ServiceCall):
        """Log a symptom or note."""
        user = call.data[ATTR_USER]
        symptom = call.data[ATTR_SYMPTOM]
        notes = call.data.get(ATTR_NOTES, "")
        date_str = call.data.get(ATTR_DATE, datetime.now().date().isoformat())
        
        if user in hass.data[DOMAIN]["data"]["users"]:
            symptom_entry = {
                "date": date_str,
                "symptom": symptom,
                "notes": notes
            }
            hass.data[DOMAIN]["data"]["users"][user]["symptoms"].append(symptom_entry)
            await hass.data[DOMAIN]["store"].async_save(hass.data[DOMAIN]["data"])
            _LOGGER.info(f"Logged symptom for {user}: {symptom}")
    
    async def backup_data(call: ServiceCall):
        """Backup all data to a file."""
        backup_path = call.data.get(ATTR_BACKUP_PATH, f"/config/{DOMAIN}_backup.json")
        
        try:
            with open(backup_path, 'w') as f:
                json.dump(hass.data[DOMAIN]["data"], f, indent=2)
            _LOGGER.info(f"Backup created at {backup_path}")
        except Exception as e:
            _LOGGER.error(f"Backup failed: {e}")
    
    async def restore_data(call: ServiceCall):
        """Restore data from a backup file."""
        backup_path = call.data.get(ATTR_BACKUP_PATH, f"/config/{DOMAIN}_backup.json")
        
        try:
            with open(backup_path, 'r') as f:
                restored_data = json.load(f)
            hass.data[DOMAIN]["data"] = restored_data
            await hass.data[DOMAIN]["store"].async_save(hass.data[DOMAIN]["data"])
            _LOGGER.info(f"Data restored from {backup_path}")
        except Exception as e:
            _LOGGER.error(f"Restore failed: {e}")
    
    async def modify_user_data(call: ServiceCall):
        """Allow parent to modify data for a child."""
        parent = call.data[ATTR_USER]
        target_user = call.data[ATTR_TARGET_USER]
        
        # Check if parent has access
        if target_user in hass.data[DOMAIN]["data"].get("parent_access", {}):
            if parent in hass.data[DOMAIN]["data"]["parent_access"][target_user]:
                # Parent can modify - handle based on other parameters
                _LOGGER.info(f"Parent {parent} modifying data for {target_user}")
                # Additional modification logic would go here
            else:
                _LOGGER.warning(f"Parent {parent} denied access to {target_user}")
        else:
            _LOGGER.warning(f"No parent access configured for {target_user}")
    
    # Register services
    hass.services.async_register(
        DOMAIN, SERVICE_LOG_PERIOD_START, log_period_start,
        schema=vol.Schema({
            vol.Required(ATTR_USER): cv.string,
            vol.Optional(ATTR_DATE): cv.string,
        })
    )
    
    hass.services.async_register(
        DOMAIN, SERVICE_LOG_PERIOD_END, log_period_end,
        schema=vol.Schema({
            vol.Required(ATTR_USER): cv.string,
            vol.Optional(ATTR_DATE): cv.string,
        })
    )
    
    hass.services.async_register(
        DOMAIN, SERVICE_LOG_SYMPTOM, log_symptom,
        schema=vol.Schema({
            vol.Required(ATTR_USER): cv.string,
            vol.Required(ATTR_SYMPTOM): cv.string,
            vol.Optional(ATTR_NOTES): cv.string,
            vol.Optional(ATTR_DATE): cv.string,
        })
    )
    
    hass.services.async_register(
        DOMAIN, SERVICE_BACKUP_DATA, backup_data,
        schema=vol.Schema({
            vol.Optional(ATTR_BACKUP_PATH): cv.string,
        })
    )
    
    hass.services.async_register(
        DOMAIN, SERVICE_RESTORE_DATA, restore_data,
        schema=vol.Schema({
            vol.Optional(ATTR_BACKUP_PATH): cv.string,
        })
    )
    
    hass.services.async_register(
        DOMAIN, SERVICE_MODIFY_USER_DATA, modify_user_data,
        schema=vol.Schema({
            vol.Required(ATTR_USER): cv.string,
            vol.Required(ATTR_TARGET_USER): cv.string,
        })
    )
    
    # Load platforms
    hass.async_create_task(
        hass.helpers.discovery.async_load_platform('sensor', DOMAIN, {}, config)
    )
    
    return True


class MenstruationTrackerSensor(Entity):
    """Representation of a Menstruation Tracker sensor."""
    
    def __init__(self, hass: HomeAssistant, user: str):
        """Initialize the sensor."""
        self._hass = hass
        self._user = user
        self._state = None
        self._attributes = {}
        
        # Register this tracker
        hass.data[DOMAIN]["trackers"][user] = self
    
    @property
    def name(self):
        """Return the name of the sensor."""
        return f"Menstruation Tracker {self._user}"
    
    @property
    def unique_id(self):
        """Return unique ID."""
        return f"{DOMAIN}_{self._user}"
    
    @property
    def state(self):
        """Return the state of the sensor."""
        return self._state
    
    @property
    def extra_state_attributes(self):
        """Return the state attributes."""
        return self._attributes
    
    def _calculate_predictions(self, cycles: List[Dict]) -> Dict:
        """Calculate predictions based on historical data."""
        if len(cycles) < 2:
            return {
                "next_period": None,
                "confidence": "low",
                "average_cycle_length": 28
            }
        
        # Calculate average cycle length
        cycle_lengths = [c["cycle_length"] for c in cycles if c.get("cycle_length")]
        
        if not cycle_lengths:
            return {
                "next_period": None,
                "confidence": "low",
                "average_cycle_length": 28
            }
        
        avg_length = mean(cycle_lengths)
        std_dev = stdev(cycle_lengths) if len(cycle_lengths) > 1 else 0
        
        # Get last cycle start
        last_cycle = cycles[-1]
        last_start = datetime.fromisoformat(last_cycle["start_date"])
        
        # Predict next period
        next_period = last_start + timedelta(days=int(avg_length))
        
        # Confidence based on standard deviation
        confidence = "high" if std_dev < 3 else "medium" if std_dev < 7 else "low"
        
        return {
            "next_period": next_period.date().isoformat(),
            "next_period_range": [
                (next_period - timedelta(days=int(std_dev * 2))).date().isoformat(),
                (next_period + timedelta(days=int(std_dev * 2))).date().isoformat()
            ],
            "confidence": confidence,
            "average_cycle_length": round(avg_length, 1),
            "cycle_variability": round(std_dev, 1)
        }
    
    def _calculate_fertility_window(self, cycles: List[Dict]) -> Dict:
        """Calculate fertility window using NFP rules."""
        if len(cycles) < 2:
            return None
        
        predictions = self._calculate_predictions(cycles)
        if not predictions["next_period"]:
            return None
        
        next_period = datetime.fromisoformat(predictions["next_period"])
        
        # NFP: Ovulation typically occurs 12-16 days before next period
        # Fertile window: 5 days before ovulation + ovulation day + 1 day after
        ovulation_day = next_period - timedelta(days=14)
        fertile_start = ovulation_day - timedelta(days=5)
        fertile_end = ovulation_day + timedelta(days=1)
        
        return {
            "ovulation_date": ovulation_day.date().isoformat(),
            "fertile_window_start": fertile_start.date().isoformat(),
            "fertile_window_end": fertile_end.date().isoformat(),
            "fertile_days_remaining": max(0, (fertile_end - datetime.now()).days)
        }
    
    def _calculate_statistics(self, cycles: List[Dict]) -> Dict:
        """Calculate cycle statistics."""
        if not cycles:
            return {}
        
        cycle_lengths = [c["cycle_length"] for c in cycles if c.get("cycle_length")]
        period_lengths = []
        
        for cycle in cycles:
            if cycle["start_date"] and cycle["end_date"]:
                start = datetime.fromisoformat(cycle["start_date"])
                end = datetime.fromisoformat(cycle["end_date"])
                period_lengths.append((end - start).days + 1)
        
        stats = {
            "total_cycles": len(cycles),
            "cycles_with_data": len(cycle_lengths)
        }
        
        if cycle_lengths:
            stats.update({
                "shortest_cycle": min(cycle_lengths),
                "longest_cycle": max(cycle_lengths),
                "average_cycle": round(mean(cycle_lengths), 1)
            })
        
        if period_lengths:
            stats.update({
                "average_period_length": round(mean(period_lengths), 1),
                "shortest_period": min(period_lengths),
                "longest_period": max(period_lengths)
            })
        
        return stats
    
    async def async_update(self):
        """Update the sensor."""
        user_data = self._hass.data[DOMAIN]["data"]["users"].get(self._user)
        
        if not user_data:
            self._state = "No Data"
            return
        
        cycles = user_data.get("cycles", [])
        
        if not cycles:
            self._state = "No Cycles Logged"
            return
        
        # Check current period status
        last_cycle = cycles[-1]
        if last_cycle["end_date"] is None:
            self._state = "In Period"
            start_date = datetime.fromisoformat(last_cycle["start_date"])
            days_in_period = (datetime.now() - start_date).days + 1
            self._attributes["days_in_current_period"] = days_in_period
        else:
            self._state = "Not in Period"
        
        # Add predictions
        predictions = self._calculate_predictions(cycles)
        self._attributes.update(predictions)
        
        # Add fertility tracking
        fertility = self._calculate_fertility_window(cycles)
        if fertility:
            self._attributes["fertility_window"] = fertility
        
        # Add statistics
        stats = self._calculate_statistics(cycles)
        self._attributes["statistics"] = stats
        
        # Add recent symptoms
        symptoms = user_data.get("symptoms", [])
        if symptoms:
            self._attributes["recent_symptoms"] = symptoms[-5:]
        
        # Days until next predicted period
        if predictions["next_period"]:
            next_period = datetime.fromisoformat(predictions["next_period"])
            days_until = (next_period - datetime.now()).days
            self._attributes["days_until_next_period"] = days_until
