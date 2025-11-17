sudo apt update
sudo apt install ansible -y

ansible-vault decrypt .env.encrypt --output .env --vault-password-file .ansible_pass
docker compose up --build -d