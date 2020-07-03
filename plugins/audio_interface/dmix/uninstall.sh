#!/bin/bash

# Uninstall dependendencies
# apt-get remove -y

sudo systemctl stop dmix-silence
sudo systemctl disable dmix-silence
sudo rm -f /etc/systemd/system/dmix-silence.service
sudo systemctl stop dmix-loop
sudo systemctl disable dmix-loop
sudo rm -f /etc/systemd/system/dmix-loop.service
sudo systemctl daemon-reload

rm /home/volumio/.dmix-plugin.conf

echo "Done"
echo "pluginuninstallend"