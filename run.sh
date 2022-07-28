bash -c "sam build --beta-features"
bash -c "cat .env | sam deploy --guided"