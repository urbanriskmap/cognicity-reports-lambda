
openssl aes-256-cbc -K $fb_telegram_param_key -iv $fb_telegram_param_iv -in env.yml.enc -out testDecryption -d
