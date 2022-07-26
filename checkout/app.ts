import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import axios from "axios";

const STRIPE_KEY = process.env.STRIPE_KEY as string;
const API_URL = process.env.API_URL as string;
const API_TOKEN = process.env.API_TOKEN as string;
const SUCCESS_URL = process.env.SUCCESS_URL as string;
const CANCEL_URL = process.env.CANCEL_URL as string;

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const productId = event.pathParameters?.productId;

    const {
        data: {
            data: { attributes },
        },
    } = await axios.get(`${API_URL}/api/products/${productId}?populate=%2A`, { headers: { Authorization: `Bearer ${API_TOKEN}` } });

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });

    // **** I need to add tax for this

    const checkout = await stripe.checkout.sessions.create({
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        automatic_tax: { enabled: true },
        customer_creation: "if_required",
        shipping_address_collection: { allowed_countries: ["AU"] },
        // shipping_options: attributes.shipping_rates.data.map(({ data: { attributes } }: { data: { attributes: any } }) => ({})),
        shipping_options: [
            {
                shipping_rate_data: {
                    display_name: "Hello world",
                    type: "fixed_amount",
                    delivery_estimate: { minimum: { unit: "business_day", value: 1 }, maximum: { unit: "business_day", value: 10 } },
                    fixed_amount: { amount: 1500, currency: "AUD" },
                },
            },
        ],
        line_items: [{ price_data: { currency: "AUD", product_data: { name: "Product 1", description: "This is my product", images: ["this-is-my-image"] }, unit_amount: 1500 } }],
    });
    if (!checkout.url) throw Error("Checkout failed");

    return {
        statusCode: 302,
        headers: {
            Location: checkout.url,
        },
        body: checkout.url,
    };
};
