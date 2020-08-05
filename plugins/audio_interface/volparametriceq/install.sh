#!/bin/bash

echo "Installing volparametriceq dependencies"

#sudo apt-get update
#sudo apt-get -y install caps
libpath=/data/plugins/audio_interface/volparametriceq
derrormess="Failed to extract caps"
echo "Detecting cpu"
cpu=$(lscpu | awk 'FNR == 1 {print $2}')
#echo "$cpu is the cpu"

if [ $cpu = "armv6l" ] || [ $cpu = "armv7l" ] || [ $cpu = "aarch64" ] || [ $cpu = "i686" ];
then
	cd $libpath
        echo "Cpu is $cpu, installing required caps version."
	sudo cp /data/plugins/audio_interface/volparametriceq/caps-$cpu.tar /caps.tar
	cd /
	sudo tar xvf caps.tar
	sudo rm /caps.tar
	if [ $? -eq 0 ]
		then
			echo "Extracting data"
		else
			echo "$derrormess"
			exit -1
		fi

else

	echo "Unsupported cpu ($cpu)"
	exit -1
fi

echo "Clearing configuration from previous installations"
if [ ! -f "/data/configuration/audio_interface/volparametriceq/config.json" ];
	then
		echo "file doesn't exist, nothing to do"
	else
		echo "File exists removing it"
		sudo rm /data/configuration/audio_interface/volparametriceq/config.json
fi

#required to end the plugin install
echo "plugininstallend"
