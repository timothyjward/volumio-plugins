 'use strict';

 //var io = require('socket.io-client');
 var fs = require('fs-extra');
 var libFsExtra = require('fs-extra');
 var exec = require('child_process').exec;
 var execSync = require('child_process').execSync;
 var libQ = require('kew');
 var config = new (require('v-conf'))();
 // var libNet = require('net');
 // var net = require('net');



 // Define the ControllerVolsimpleequal class
 module.exports = ControllerVolsimpleequal;

 function ControllerVolsimpleequal(context) {
  var self = this;
  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.commandRouter.logger;
  self.configManager = self.context.configManager;
 }

 ControllerVolsimpleequal.prototype.onVolumioStart = function() {
  var self = this;
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  self.config = new(require('v-conf'))();
  self.config.loadFile(configFile);
  
  var defer = libQ.defer();
  
  self.modprobeLoopBackDevice()
    .then(function(e) {
      self.logger.info('Volsimpleequal Started');
      defer.resolve();
    })
    .fail(function(e) {
      self.logger.warn('Failed to start Volsimpleequal', e);
      defer.reject(e);
    });
    
    return defer.promise;
 };

 ControllerVolsimpleequal.prototype.getConfigurationFiles = function() {
  return ['config.json'];
 };

 // Plugin methods -----------------------------------------------------------------------------
 //here we load snd_aloop module to provide a Loopback device 
 ControllerVolsimpleequal.prototype.modprobeLoopBackDevice = function() {
  var self = this;
  var defer = libQ.defer();

  exec("/usr/bin/sudo /sbin/modprobe snd_aloop index=7 pcm_substreams=2", {
   uid: 1000,
   gid: 1000
  }, function(error, stdout, stderr) {
   if (error) {
    self.logger.info('failed to load snd_aloop ' + error);
   } else {
    self.commandRouter.pushConsoleMessage('snd_aloop loaded');
   }
   defer.resolve();
  });
  return defer.promise;
 };

 // here we make the bridge between Loopback and equal
 ControllerVolsimpleequal.prototype.bridgeLoopBackequal = function() {
  var self = this;
  var defer = libQ.defer();
  setTimeout(function() {
  exec("/usr/bin/sudo /bin/systemctl start volsimpleequal.service", {
   uid: 1000,
   gid: 1000
  }, function(error, stdout, stderr) {
   if (error) {
    self.logger.info('failed to bridge ' + error);
   } else {
    self.commandRouter.pushConsoleMessage('Alsaloop bridge ok');
    defer.resolve();
   }
  });

   return defer.promise;
  }, 6500)
 };

 //here we send equalizer settings
 ControllerVolsimpleequal.prototype.sendequal = function(defer) {
  var self = this;
  var eqprofile = self.config.get('eqprofile')
  var enablemyeq = self.config.get('enablemyeq')
  var scoef
  console.log('myeq or preset =' + enablemyeq)

  if (self.config.get('enablemyeq') == false) {
   if (eqprofile === 'flat')
    scoef = self.config.get('flat')
   else if (eqprofile === 'loudness')
    scoef = self.config.get('loudness')
   else if (eqprofile === 'rock')
    scoef = self.config.get('rock')
   else if (eqprofile === 'classic')
    scoef = self.config.get('classic')
   else if (eqprofile === 'bass')
    scoef = self.config.get('bass')
   else if (eqprofile === 'voice')
    scoef = self.config.get('voice')
  else if (eqprofile === 'soundtrack')
    scoef = self.config.get('soundtrack')
  else if (eqprofile === 'mypreset1')
    scoef = self.config.get('mypreset1')
  else if (eqprofile === 'mypreset2')
    scoef = self.config.get('mypreset2')
  else if (eqprofile === 'mypreset3')
    scoef = self.config.get('mypreset3')
   } else scoef = self.config.get('coef')


  var i
  var j
  var x
  var k
  //equalizer offset
  var z = 60;
  var coefarray = scoef.split(',');

  // for every value that we put in array, we set the according bar value
  for (var i in coefarray) {
    j = i
    i = ++i
    k = parseInt(coefarray[j], 10);
    x = k + z;
  
    console.log("/bin/echo /usr/bin/amixer -D volumioSimpleEqual cset numid=" + [i] + " " + x )
    exec("/usr/bin/amixer -D volumioSimpleEqual cset numid=" + [i] + " " + x , {
    uid: 1000,
    gid: 1000
   }, function(error, stdout, stderr) {});
  }
 };

 ControllerVolsimpleequal.prototype.onStop = function() {
  return libQ.resolve();
 };


 ControllerVolsimpleequal.prototype.onStart = function() {
  var self = this;

  var defer = libQ.defer();
  self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile')
    .then(function(e) {
      return self.bridgeLoopBackequal();
    })
    .then(function(e) {
      self.logger.info('Volsimpleequal Started');
      defer.resolve();
    })
    .fail(function(e) {
      defer.reject(new Error());
    });
   return defer.promise;
 };

 ControllerVolsimpleequal.prototype.onRestart = function() {
  var self = this;
 };

 ControllerVolsimpleequal.prototype.onInstall = function() {
  var self = this;
  //	//Perform your installation tasks here
 };

 ControllerVolsimpleequal.prototype.onUninstall = function() {
  var self = this;
  //Perform your installation tasks here
 };

 ControllerVolsimpleequal.prototype.getUIConfig = function() {
  var self = this;
  var defer = libQ.defer();
  var lang_code = this.commandRouter.sharedVars.get('language_code');
  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
   .then(function(uiconf) {
    //equalizer section
    uiconf.sections[0].content[0].value = self.config.get('enablemyeq');
  //  uiconf.sections[0].content[1].value = self.config.get('eqprofile');
  	var value;
    value = self.config.get('eqprofile');
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[1].value.value', value);
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[1].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[1].options'), value));
	
    //for coef in equalizer
    // we retrieve the coefficient configuration
    var coefconf = self.config.get('coef');
    // it is a string, so to get single values we split them by , and create an array from that
    var coefarray = coefconf.split(',');
    //console.log(coefarray)
    // for every value that we put in array, we set the according bar value
    for (var i in coefarray) {
     uiconf.sections[0].content[2].config.bars[i].value = coefarray[i]
    }

  //for equalizer custom mypreset1
    // we retrieve the coefficient configuration
    var cmypreset1 = self.config.get('mypreset1');
    // it is a string, so to get single values we split them by , and create an array from that
    var coefarrayp1 = cmypreset1.split(',');
    //console.log(coefarrayp1)
    // for every value that we put in array, we set the according bar value
    for (var i in coefarrayp1) {
     uiconf.sections[1].content[1].config.bars[i].value = coefarrayp1[i]
    }
  //for equalizer custom mypreset2
    // we retrieve the coefficient configuration
    var cmypreset2 = self.config.get('mypreset2');
    // it is a string, so to get single values we split them by , and create an array from that
    var coefarrayp2 = cmypreset2.split(',');
    //console.log(coefarrayp2)
    // for every value that we put in array, we set the according bar value
    for (var i in coefarrayp2) {
     uiconf.sections[1].content[2].config.bars[i].value = coefarrayp2[i]
    }
  //for equalizer custom mypreset3
    // we retrieve the coefficient configuration
    var cmypreset3= self.config.get('mypreset3');
    // it is a string, so to get single values we split them by , and create an array from that
    var coefarrayp3 = cmypreset3.split(',');
    //console.log(coefarrayp3)
    // for every value that we put in array, we set the according bar value
    for (var i in coefarrayp3) {
     uiconf.sections[1].content[3].config.bars[i].value = coefarrayp3[i]
    }

    defer.resolve(uiconf);
   })
   .fail(function() {
    defer.reject(new Error());
   })
  return defer.promise


 };


 ControllerVolsimpleequal.prototype.getLabelForSelect = function(options, key) {
  var n = options.length;
  for (var i = 0; i < n; i++) {
   if (options[i].value == key)
    return options[i].label;
  }
  return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
 };

 ControllerVolsimpleequal.prototype.setUIConfig = function(data) {
  var self = this;

 };

 ControllerVolsimpleequal.prototype.getConf = function(varName) {
  var self = this;
  //Perform your installation tasks here
 };


 ControllerVolsimpleequal.prototype.setConf = function(varName, varValue) {
  var self = this;
  //Perform your installation tasks here
 };

 //here we save the equalizer settings
 ControllerVolsimpleequal.prototype.savealsaequal = function(data) {
  var self = this;
  var defer = libQ.defer();
  self.config.set('enablemyeq', data['enablemyeq']);
  self.config.set('eqprofile', data['eqprofile'].value);
  self.config.set('coef', data['coef']);
  self.logger.info('Equalizer Configurations have been set');
  self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString("COMMON.CONFIGURATION_UPDATE"));
  self.sendequal(defer);
  return defer.promise;
 };

//here we save the equalizer preset
 ControllerVolsimpleequal.prototype.saveequalizerpreset = function(data) {
  var self = this;
  var defer = libQ.defer();

  self.config.set('mypreset1', data['mypreset1']);
  self.config.set('mypreset2', data['mypreset2']);
  self.config.set('mypreset3', data['mypreset3']);
  
  self.logger.info('Equalizer preset saved');
  self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('COMMON.CONFIGURATION_UPDATE_DESCRIPTION'));

  return defer.promise;
 };

 ControllerVolsimpleequal.prototype.setAdditionalConf = function(type, controller, data) {
  var self = this;
  return self.commandRouter.executeOnPlugin(type, controller, 'setConfigParam', data);
 };

 ControllerVolsimpleequal.prototype.getAdditionalConf = function(type, controller, data) {
  var self = this;
  return self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);
 }
