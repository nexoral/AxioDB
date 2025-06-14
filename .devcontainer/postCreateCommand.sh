#!/bin/bash

sudo apt-get update -y           # Update apt-get cache
sudo apt-get install -y neofetch # Install curl

# install Node.js and npm
curl -sL https://deb.nodesource.com/setup_22.x | sudo -E bash
sudo apt-get install -y nodejs # Install Node.js and npm

# Install Dependencies for all the section of this project
npm install --force && npm run build # Install & build dependencies for AxioDB main Codebase

# Install Dependencies for the AxioDB Docker
cd ./Docker && npm i --force && cd .. # Install & build dependencies for AxioDB Docker

# Install Dependencies for the AxioDB Documentation
cd ./Document && npm i --force && cd .. # Install & build dependencies for AxioDB Documentation

# Install Dependencies for the AxioDB GUI
cd ./GUI && npm i --force && cd .. # Install & build dependencies for AxioDB GUI