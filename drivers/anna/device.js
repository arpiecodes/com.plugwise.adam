'use strict';

const PlugwiseThermostatDevice = require('../../lib/PlugwiseThermostatDevice');

module.exports = class PlugwiseAnnaDevice extends PlugwiseThermostatDevice {

  onInit(...props) {
    super.onInit(...props);

    this.registerCapabilityListener('location_preset', this.onCapabilityLocationPreset.bind(this));

    if (!this.hasCapability('measure_luminance')) {
      this.addCapability('measure_luminance').catch(this.error);
    }
  }

  async onCapabilityLocationPreset(value) {
    await this.setPreset(value);
  }

  onPoll({ appliance, payload }) {
    // console.log(JSON.stringify(appliance, false, 2));

    if (appliance
     && appliance.location
     && appliance.location.$attr
     && appliance.location.$attr.id) {
      this.locationId = appliance.location.$attr.id;
    }

    if (payload
     && payload.location
     && Array.isArray(payload.location)
     && this.locationId) {
      const location = payload.location.find(location => {
        if (!location.$attr) return false;
        return location.$attr.id === this.locationId;
      });

      if (location
       && location.preset) {
        this.setCapabilityValue('location_preset', location.preset || null).catch(this.error);
      }
    }

    // measure_luminance
    if (appliance
     && appliance.logs
     && Array.isArray(appliance.logs.point_log)) {
      appliance.logs.point_log.forEach(log => {
        if (log.type === 'illuminance'
         && log.unit === 'lx'
         && log.period
         && log.period.measurement) {
          const value = parseFloat(log.period.measurement.$text);
          this.setCapabilityValue('measure_luminance', value).catch(this.error);
        }
      });
    }
  }

  async setPreset(preset) {
    const { applianceId } = this;

    return this.bridge.setPreset({
      applianceId,
      preset,
    });
  }

};
