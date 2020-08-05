'use strict';

//var io = require('socket.io-client');
var fs = require('fs-extra');
var libFsExtra = require('fs-extra');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var libQ = require('kew');
var config = new (require('v-conf'))();

// Define the Controllervolparametriceq class
module.exports = Controllervolparametriceq;

function Controllervolparametriceq(context) {
  var self = this;
  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.context.logger;

  self.configManager = self.context.configManager;
}

Controllervolparametriceq.prototype.onVolumioStart = function () {
  var self = this;
  var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
  
  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
  return libQ.resolve();
};

Controllervolparametriceq.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

// Plugin methods -----------------------------------------------------------------------------


Controllervolparametriceq.prototype.onStop = function () {
  return libQ.resolve();
};

Controllervolparametriceq.prototype.onStart = function () {
  var self = this;

  var defer = libQ.defer();
  self.rebuildvolparametriceq()
    .then(function (e) {
      self.logger.info('volparametriceq Started');
      defer.resolve();
    })
    .fail(function (e) {
      defer.reject(new Error());
    });
  return defer.promise;
};

Controllervolparametriceq.prototype.onRestart = function () {
  var self = this;
};

Controllervolparametriceq.prototype.onInstall = function () {
  var self = this;
  //Perform your installation tasks here
};

Controllervolparametriceq.prototype.onUninstall = function () {
  var self = this;
  //Perform your installation tasks here
};

Controllervolparametriceq.prototype.getUIConfig = function () {
  var self = this;
  var defer = libQ.defer();
  var lang_code = this.commandRouter.sharedVars.get('language_code');
  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
    .then(function (uiconf) {

      uiconf.sections[0].content[0].config.bars[0].value = self.config.get('mg');

      var coefconfp1 = self.config.get('p11');
      // it is a string, so to get single values we split them by , and create an array from that
      var coefarrayp1 = coefconfp1.split(',');
      //console.log(coefarray)
      // for every value that we put in array, we set the according bar value
      for (var i in coefarrayp1) {
        uiconf.sections[0].content[1].config.bars[i].value = coefarrayp1[i]
      }
      var coefconfp2 = self.config.get('p21');
      // it is a string, so to get single values we split them by , and create an array from that
      var coefarrayp2 = coefconfp2.split(',');
      //console.log(coefarray)
      // for every value that we put in array, we set the according bar value
      for (var i in coefarrayp2) {
        uiconf.sections[0].content[2].config.bars[i].value = coefarrayp2[i]
      }
      var coefconfp3 = self.config.get('p31');
      // it is a string, so to get single values we split them by , and create an array from that
      var coefarrayp3 = coefconfp3.split(',');
      //console.log(coefarray)
      // for every value that we put in array, we set the according bar value
      for (var i in coefarrayp3) {
        uiconf.sections[0].content[3].config.bars[i].value = coefarrayp3[i]
      }
      var coefconfp4 = self.config.get('p41');
      // it is a string, so to get single values we split them by , and create an array from that
      var coefarrayp4 = coefconfp4.split(',');
      //console.log(coefarray)
      // for every value that we put in array, we set the according bar value
      for (var i in coefarrayp4) {
        uiconf.sections[0].content[4].config.bars[i].value = coefarrayp4[i]

      }
      uiconf.sections[0].content[5].value = self.config.get('enableeq');
      //advanced settings
      uiconf.sections[1].content[1].value = self.config.get('p11lf');
      uiconf.sections[1].content[2].value = self.config.get('p11hf');
      uiconf.sections[1].content[3].value = self.config.get('p11s');
      uiconf.sections[1].content[4].value = self.config.get('p21lf');
      uiconf.sections[1].content[5].value = self.config.get('p21hf');
      uiconf.sections[1].content[6].value = self.config.get('p21s');
      uiconf.sections[1].content[7].value = self.config.get('p31lf');
      uiconf.sections[1].content[8].value = self.config.get('p31hf');
      uiconf.sections[1].content[9].value = self.config.get('p31s');
      uiconf.sections[1].content[10].value = self.config.get('p41lf');
      uiconf.sections[1].content[11].value = self.config.get('p41hf');
      uiconf.sections[1].content[12].value = self.config.get('p41s');
      var value;
      defer.resolve(uiconf);
    })
    .fail(function () {
      defer.reject(new Error());
    });
  return defer.promise;
};

Controllervolparametriceq.prototype.getLabelForSelect = function (options, key) {
  var n = options.length;
  for (var i = 0; i < n; i++) {
    if (options[i].value == key)
      return options[i].label;
  }
  return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

Controllervolparametriceq.prototype.setUIConfig = function (data) {
  var self = this;

};

Controllervolparametriceq.prototype.getConf = function (varName) {
  var self = this;
  //Perform your installation tasks here
};


Controllervolparametriceq.prototype.setConf = function (varName, varValue) {
  var self = this;
  //Perform your installation tasks here
};

//here we save the asound.conf file config
Controllervolparametriceq.prototype.createASOUNDFile = function () {
  var self = this;

  var defer = libQ.defer();
  
  var folder = self.commandRouter.pluginManager.findPluginFolder('audio_interface', 'volparametriceq');

  var alsaFile = folder + '/asound/volumioParametricEqual.postParametricEqual.10.conf';

  try {
    if(self.config.get('enableeq') == true) {  
      var data = fs.readFileSync(__dirname + "/asound.tmpl", 'utf8');
      var p11r
      var p11 = self.config.get('p11');
      p11r = p11.replace(/,/g, " ");
      console.log(p11r);
      var p21r
      var p21 = self.config.get('p21');
      p21r = p21.replace(/,/g, " ");
      console.log(p21r);
      var p31r
      var p31 = self.config.get('p31');
      p31r = p31.replace(/,/g, " ");
      console.log(p31r);
      var p41r
      var p41 = self.config.get('p41');
      p41r = p41.replace(/,/g, " ");
      console.log(p41r);

      var conf2 = data.replace("${p11}", p11r);
      var conf3 = conf2.replace("${p21}", p21r);
      var conf4 = conf3.replace("${p31}", p31r);
      var conf5 = conf4.replace("${p41}", p41r);
      var conf6 = conf5.replace("${mg}", self.config.get('mg'));
      
      fs.writeFileSync(alsaFile, conf6, 'utf8');
    } else {
      if(fs.existsSync(alsaFile)) {    	  
        fs.unlinkSync(alsaFile);
      }
    }
    
    defer.resolve();
  } catch (err) {
    defer.reject(err);
  }
  return defer.promise;
};

//here we save the asound.conf file config
Controllervolparametriceq.prototype.createUIFile = function () {
  var self = this;

  var defer = libQ.defer();

  try {

    fs.readFile(__dirname + "/UIConfig.tmpl", 'utf8', function (err, data) {
      if (err) {
        defer.reject(new Error(err));
        return console.log(err);
      }


      var conf1 = data.replace("${p11lf}", self.config.get('p11lf'));
      var conf2 = conf1.replace("${p11hf}", self.config.get('p11hf'));
      var conf3 = conf2.replace("${p11lf2}", self.config.get('p11lf'));
      var conf4 = conf3.replace("${p11hf2}", self.config.get('p11hf'));
      var conf5 = conf4.replace("${p11s}", self.config.get('p11s'));
      var conf6 = conf5.replace("${p21lf}", self.config.get('p21lf'));
      var conf7 = conf6.replace("${p21hf}", self.config.get('p21hf'));
      var conf8 = conf7.replace("${p21lf2}", self.config.get('p21lf'));
      var conf9 = conf8.replace("${p21hf2}", self.config.get('p21hf'));
      var conf10 = conf9.replace("${p21s}", self.config.get('p21s'));
      var conf11 = conf10.replace("${p31lf}", self.config.get('p31lf'));
      var conf12 = conf11.replace("${p31hf}", self.config.get('p31hf'));
      var conf13 = conf12.replace("${p31lf2}", self.config.get('p31lf'));
      var conf14 = conf13.replace("${p31hf2}", self.config.get('p31hf'));
      var conf15 = conf14.replace("${p31s}", self.config.get('p31s'));
      var conf16 = conf15.replace("${p41lf}", self.config.get('p41lf'));
      var conf17 = conf16.replace("${p41hf}", self.config.get('p41hf'));
      var conf18 = conf17.replace("${p41lf2}", self.config.get('p41lf'));
      var conf19 = conf18.replace("${p41hf2}", self.config.get('p41hf'));
      var conf20 = conf19.replace("${p41s}", self.config.get('p41s'));

      fs.writeFile("/data/plugins/audio_interface/volparametriceq/UIConfig.json", conf20, 'utf8', function (err) {
        if (err) {
          defer.reject(new Error(err));
          self.logger.info('Cannot write UIConfig' + err)
        } else {
          self.logger.info('UIconfig.json file written');

          defer.resolve();
        }
      });

    });
  } catch (err) { }

  setTimeout(function () {
    return defer.promise;

  }, 200);
};

Controllervolparametriceq.prototype.savevolparametriceq = function (data) {
  var self = this;

  var defer = libQ.defer();

  self.config.set('mg', data['mg']);
  self.config.set('p11', data['p11']);
  self.config.set('p21', data['p21']);
  self.config.set('p31', data['p31']);
  self.config.set('p41', data['p41']);
  self.config.set('enableeq', data['enableeq']);
  self.logger.info('Configurations of equalizer have been set');

  self.rebuildvolparametriceq()
    .then(function (e) {
      //  self.commandRouter.pushToastMessage('success', "Bauer Configuration updated");
      defer.resolve({});
    })
    .fail(function (e) {
      defer.reject(new Error('error'));
      //  self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
    })


  return defer.promise;

};
Controllervolparametriceq.prototype.saveAdvanced = function (data) {
  var self = this;

  var defer = libQ.defer();

  self.config.set('p11lf', data['p11lf']);
  self.config.set('p11hf', data['p11hf']);
  self.config.set('p11s', data['p11s']);
  self.config.set('p21lf', data['p21lf']);
  self.config.set('p21hf', data['p21hf']);
  self.config.set('p21s', data['p21s']);
  self.config.set('p31lf', data['p31lf']);
  self.config.set('p31hf', data['p31hf']);
  self.config.set('p31s', data['p31s']);
  self.config.set('p41lf', data['p41lf']);
  self.config.set('p41hf', data['p41hf']);
  self.config.set('p41s', data['p41s']);
  self.logger.info('New bands of equalizer have been set');

  self.createUIFile();
  self.reloadUi();
  /* .then(function(e) {
  //     self.commandRouter.pushToastMessage('success', "Configuration updated");
 
    defer.resolve({});
    })
    .fail(function(e) {
        defer.reject(new Error('error'));
   //  self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
    })
 */

  return defer.promise;

};

Controllervolparametriceq.prototype.rebuildvolparametriceq = function () {
  var self = this;
  var defer = libQ.defer();
  self.createASOUNDFile()
    .then(function() {      
      return self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile');
    }).then(function () {
      self.commandRouter.pushToastMessage('success', 'Equalizer applied');
      defer.resolve();
    }).fail(function(){
      self.commandRouter.pushToastMessage('error', 'a problem occurred');
      defer.reject();
    });

    return defer.promise;

};

Controllervolparametriceq.prototype.setAdditionalConf = function (type, controller, data) {
  var self = this;
  return self.commandRouter.executeOnPlugin(type, controller, 'setConfigParam', data);
};

Controllervolparametriceq.prototype.getAdditionalConf = function (type, controller, data) {
  var self = this;
  return self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);
};

Controllervolparametriceq.prototype.restoredefaultsettings = function () {
  var self = this;

  //  return new Promise(function(resolve, reject) {
  try {
    var cp = execSync('/bin/cp /data/plugins/audio_interface/volparametriceq/UIConfig.json.ori /data/plugins/audio_interface/volparametriceq/UIConfig.json')
    self.commandRouter.pushToastMessage('info', "Default Settings restored, Please reload the page");

  } catch (err) {
    self.logger.info('UIConfig.json.ori does not exist');
  }
  //  resolve();
  // });
  return self.commandRouter.reloadUi();
};

Controllervolparametriceq.prototype.reloadUi = function () {
  var self = this;
  self.logger.info('Ui has changed, forcing UI Reload');
  self.commandRouter.pushToastMessage('info', "Please reload the page, in order to see last changes");
  return self.commandRouter.reloadUi();

}
