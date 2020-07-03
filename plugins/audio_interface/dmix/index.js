'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = ControllerDmix;

function ControllerDmix(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

ControllerDmix.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
};

ControllerDmix.prototype.onStart = function() {
    var self = this;

    var folder = self.commandRouter.pluginManager.findPluginFolder('audio_interface', 'dmix');

	self.alsaFile = folder + '/asound/volumioDmix.postDmix.-1000.conf';
    
    return self.checkAndUpdate();
};

ControllerDmix.prototype.checkAndUpdate = function() {
    var self = this;

    return self.readALSASnippet().then((data) => {
        var updated = self.createALSASnippet();

        if(updated === data) {
            // Current snippet is in sync, no need to change
            return false;
        } else {
            var defer = libQ.defer();
            fs.writeFile(self.alsaFile, updated, 'utf8', (err) => {
                if (err) {
                    self.logger.info('Cannot write Dmix ALSA configuration: ' + err);
                    defer.fail();
                } else {
                    defer.resolve(true);
                }
            });
            return defer.promise;
        }
    }).then((changed) => {
        if(changed) {
            var defer = libQ.defer();
            var snippet = '';
	        snippet += 'DMIX_SAMPLE_RATE=' + self.config.get('sample_rate') + '\n';
            snippet += 'DMIX_FORMAT=' + self.config.get('sample_depth') + '\n';
            snippet += 'DMIX_CHANNELS=' + self.config.get('channels') + '\n';
            snippet += 'LOOP_LATENCY=' + self.config.get('loop_latency') + '\n';
            snippet += 'LOOP_DEVICE=hw:Loopback,1,' + self.config.get('loop_subdevice') + '\n';

            fs.writeFile('/home/volumio/.dmix-plugin.conf', snippet, 'utf8', (err) => {
                if (err) {
                    self.logger.info('Cannot update Dmix Service configuration: ' + err);
                } 
                defer.resolve(changed);
            });
        } else {
            defer.resolve(changed);
        }
        return defer.promise;
    }).then((changed) => {
        if(changed) {
            return self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile')
                .then((x) => {
                    return changed;
                });
        }
        return changed;
    }).then((changed) => {
        // Only change if strictly necessary to avoid potential pops and clicks
        var loopEnabled = self.isServiceEnabled('dmix-loop');
        if(!loopEnabled) {
            execSync('/usr/bin/sudo /bin/systemctl enable dmix-loop', { uid: 1000, gid: 1000, encoding: 'utf8' });
        }
        if(!loopEnabled || changed) {
            execSync('/usr/bin/sudo /bin/systemctl restart dmix-loop', { uid: 1000, gid: 1000, encoding: 'utf8' });
        }
        return changed;
    }).then((data) => {
        // Only change if strictly necessary to avoid potential pops and clicks
        var silenceEnabled = self.isServiceEnabled('dmix-silence');
        if(self.config.get('play_silence')) {
            if(!silenceEnabled) {
                execSync('/usr/bin/sudo /bin/systemctl enable dmix-silence', { uid: 1000, gid: 1000, encoding: 'utf8' });
            }
            if(!silenceEnabled || changed) {
                execSync('/usr/bin/sudo /bin/systemctl restart dmix-silence', { uid: 1000, gid: 1000, encoding: 'utf8' });
            }
        } else {
            execSync('/usr/bin/sudo /bin/systemctl disable dmix-silence', { uid: 1000, gid: 1000, encoding: 'utf8' });
            execSync('/usr/bin/sudo /bin/systemctl stop dmix-silence', { uid: 1000, gid: 1000, encoding: 'utf8' });
        }
    });
};

ControllerDmix.prototype.isServiceEnabled = function(serviceName) {
    var self = this;
    var result = null;

    try {
        result = execSync('/usr/bin/sudo /bin/systemctl is-enabled ' + serviceName, { uid: 1000, gid: 1000, encoding: 'utf8' });
    } catch (err) {
        // This probably isn't an error as is-enabled has a non zero exit code when the unit is disabled
        result = err.stdout;
    }

    if(result) {
        result = result.toString().trim();
        if(result === 'enabled') {
            return true;
        } else if (result === 'disabled') {
            return false;
        }
    } 
    self.logger.console.warn('Unable to determine the status of service ' + serviceName + '. The output of systemctl is-enabled was: ' + stdout.toString());
     
    return false;
};

ControllerDmix.prototype.createALSASnippet = function() {
	var self = this;
    
    var sample_rate = self.config.get('sample_rate');
    var sample_depth = self.config.get('sample_depth');
    var channels = self.config.get('channels');
    var period_time = self.config.get('period_time');
    var period_size = self.config.get('period_size');
    var buffer_size = self.config.get('buffer_size');
    var loop_latency = self.config.get('loop_latency');
    var loop_subdevice = self.config.get('loop_subdevice');
    
    var snippet = '';
	snippet += 'pcm.volumioDmix {\n';
    snippet += '    type dmix\n';
    snippet += '    ipc_key 1357\n';
    snippet += '    ipc_key_add_uid false\n';
    snippet += '    ipc_perm 0666\n';
    snippet += '    slave {\n';
    snippet += '        pcm "hw:Loopback,0,' + loop_subdevice + '"\n';
    snippet += '        rate ' + sample_rate + '\n';
    snippet += '        format "' + sample_depth + '"\n';
    snippet += '        period_time ' + period_time + '\n';
    snippet += '        period_size ' + period_size + '\n';
    snippet += '        buffer_size ' + buffer_size + '\n';
    snippet += '    }\n';
    snippet += '    bindings {\n';
    for(var i = 0; i < channels; i++) {
        snippet += '        ' + i + ' ' + i +'\n';
    }
    snippet += '    }\n';
    snippet += '}\n';
    snippet += '\n# LOOP_LATENCY is ' + loop_latency + '\n';
    
    return snippet;
};

ControllerDmix.prototype.readALSASnippet = function() {
	var self = this;
    var defer=libQ.defer();

	fs.readFile(self.alsaFile, 'utf8', (err, data) => {
        if (err) {
            self.logger.error('Failed to read Dmix ALSA contribution files. ' + err);
            defer.resolve('');
        } else {
            defer.resolve(data);
        }
    });

    return defer.promise
};

ControllerDmix.prototype.updateConfig = function(data) {
    var self = this;

    self.config.set('sample_rate', data['sample_rate'].value);
    self.config.set('sample_depth', data['sample_depth'].value);
    self.config.set('play_silence', data['play_silence']);
    self.config.set('channels', data['channels']);
    self.config.set('period_time', data['period_time']);
    self.config.set('period_size', data['period_size']);
    self.config.set('buffer_size', data['buffer_size']);
    self.config.set('loop_latency', data['loop_latency']);
    self.config.set('loop_subdevice', data['loop_subdevice']);

    return self.checkAndUpdate();
};

ControllerDmix.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

ControllerDmix.prototype.onRestart = function() {
    var self = this;
    return self.checkAndUpdate();
};


// Configuration Methods -----------------------------------------------------------------------------

ControllerDmix.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {


            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

ControllerDmix.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

ControllerDmix.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

ControllerDmix.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerDmix.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};


