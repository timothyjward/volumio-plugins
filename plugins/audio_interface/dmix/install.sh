#!/bin/bash

sudo apt-get update
sudo apt-get -y install alsa-utils

echo "Creating the environment for Dmix services"

defaultProps="DMIX_SAMPLE_RATE=44100\n
DMIX_FORMAT=S16_LE\n
DMIX_CHANNELS=2\n
LOOP_LATENCY=50000\n
LOOP_DEVICE=hw:Loopback,1,5"

echo $defaultProps | tee /home/volumio/.dmix-plugin.conf > /dev/null

echo "Creating the Dmix silence service"

service="[Unit]\n
Description=Play constant silent audio from /dev/zero to eliminate pops and clicks due to I2S clock stop/start.\n
Before=volumio.service\n
After=sound.target\n
\n
[Service]\n
ExecStart=/usr/bin/aplay -D plug:volumioDmix -t raw -r \$DMIX_SAMPLE_RATE -f \$DMIX_FORMAT -c \$DMIX_CHANNELS /dev/zero\n
StandardOutput=syslog\n
StandardError=syslog\n
SyslogIdentifier=dmix-silence\n
User=volumio\n
Group=volumio\n
EnvironmentFile=/home/volumio/.dmix-plugin.conf
\n
[Install]\n
WantedBy=multi-user.target"

echo $service | sudo tee /etc/systemd/system/dmix-silence.service > /dev/null

sudo systemctl reload dmix-silence
sudo systemctl disable dmix-silence

echo "Creating the Dmix silence service"

service="[Unit]\n
Description=Redirect audio from the Loopback device into the Volumio audio chain.\n
Before=volumio.service\n
After=sound.target\n
\n
[Service]\n
ExecStart=/usr/bin/alsaloop -C \$LOOP_DEVICE -P postDmix -t \$LOOP_LATENCY -r \$DMIX_SAMPLE_RATE -f \$DMIX_FORMAT -c \$DMIX_CHANNELS /dev/zero\n
StandardOutput=syslog\n
StandardError=syslog\n
SyslogIdentifier=dmix-loop\n
User=volumio\n
Group=volumio\n
EnvironmentFile=/home/volumio/.dmix-plugin.conf
\n
[Install]\n
WantedBy=multi-user.target"

echo $service | sudo tee /etc/systemd/system/dmix-loop.service > /dev/null

sudo systemctl reload dmix-loop
sudo systemctl disable dmix-loop


echo "Creating The Loopback sound device"
sudo modprobe snd-aloop

#requred to end the plugin install
echo "plugininstallend"
