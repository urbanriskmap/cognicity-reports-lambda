#!/bin/sh

openssl aes-256-cbc -K $fb_telegram_param_key -iv $fb_telegram_param_iv -in India.env.yml.enc -out India.env.yml -d
openssl aes-256-cbc -K $fb_telegram_param_key -iv $fb_telegram_param_iv -in US.env.yml.enc -out US.env.yml -d
