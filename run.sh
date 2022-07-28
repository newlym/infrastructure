export $(cat .env | xargs)

CONFIG="
$DB_USERNAME
$DB_PASSWORD
$STRIPE_KEY
$CMS_API_URL
$CMS_API_TOKEN
$CHECKOUT_SUCCESS_URL
$CHECKOUT_CANCEL_URL


y


"

echo "$CONFIG"

# sam build --beta-features
# sam deploy --guided << CONFIG