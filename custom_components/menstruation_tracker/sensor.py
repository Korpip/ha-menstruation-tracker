"""Sensor platform for menstruation_tracker."""
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from . import DOMAIN

async def async_setup_platform(hass, config, async_add_entities, discovery_info=None):
    """Set up the sensor platform."""
    from . import MenstruationTrackerSensor
    
    users = hass.data[DOMAIN]["data"]["users"]
    sensors = []
    
    for user in users:
        sensors.append(MenstruationTrackerSensor(hass, user))
    
    async_add_entities(sensors, True)
