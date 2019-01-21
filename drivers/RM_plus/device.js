/**
 * Driver for Broadlink devices
 *
 * Copyright 2018, R Wensveen
 *
 * This file is part of com.broadlink
 * com.broadlink is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * com.broadlink is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License
 * along with com.broadlink.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const Homey = require('homey');
const RM3MiniDevice = require('./../RM3_mini/device');
const Util = require('./../../lib/util.js');


class RmPlusDevice extends RM3MiniDevice {


	onInit() {
		super.onInit();
		this.learn = false;

		this.registerCapabilityListener('learnRFcmd', this.onCapabilityLearnRF.bind(this));
	}

	
	onCapabilityLearnMode() {
		return false;
	}
	

	/**
	 * 
	 */
	async stopRfLearning() {
		try {
			await this._communicate.cancelRFSweep();
			Util.debugLog('RF detect done')
		} catch( e ) {
			Util.debugLog('stopRfLearning - catch:'+e)
		}
		this.learn = false;
	}


	/**
	 * This method will be called when the learn state needs to be changed.
	 * @param onoff
	 * @return \c TRUE if successful, \c FALSE otherwise
	 */
	async onCapabilityLearnRF(onoff) {
	    Util.debugLog('==>RmPlusDevice.onCapabilityLearnRF');
	    if( this.learn ) {
	    	return true;
	    }
	    this.learn = true;

		try {
			Util.debugLog('==>   sweeping');
			await this._communicate.enterRFSweep()

			await Homey.ManagerSpeechOutput.say(Homey.__('rf_learn.long_press'))
			Util.debugLog(`\x1b[31m[ACTION]\x1b[0m Keep holding that button!`)
			let data = await this._communicate.checkRFData()
			Util.debugLog('==>  checked RF data ')

			await Homey.ManagerSpeechOutput.say(Homey.__('rf_learn.multi_presses'))
			Util.debugLog(`\x1b[31m[ACTION]\x1b[0m Press the RF button multiple times with a pause between them.`);
			data = await this._communicate.checkRFData2()
			Util.debugLog('==>  checked RF data 2');

			if( data ) {
				let idx = this.dataStore.dataArray.length + 1;
				let cmdname = 'rf-cmd' + idx;
				this.dataStore.addCommand( cmdname, data);
				await this.storeCmdSetting( cmdname );
			}
			await this.stopRfLearning();
			await Homey.ManagerSpeechOutput.say(Homey.__('rf_learn.done'))
			Util.debugLog('all done')
			return true;

		} catch( e ) {
			await this.stopRfLearning();
			await Homey.ManagerSpeechOutput.say(Homey.__('rf_learn.done'))
			Util.debugLog('all done in catch:'+e)
			return false;
		}
	}

}

module.exports = RmPlusDevice;
