#!/bin/bash
# Script for testing

rm text_files/* -f

python3 splitUsers.py $1

node command_script.js  $2