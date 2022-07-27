import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";

import { getBundle } from "./utils";

const STRIPE_KEY = process.env.STRIPE_KEY as string;
const API_URL = process.env.API_URL as string;
const API_TOKEN = process.env.API_TOKEN as string;
const SUCCESS_URL = process.env.SUCCESS_URL as string;
const CANCEL_URL = process.env.CANCEL_URL as string;

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const bundleId = event.pathParameters?.bundleId;
    if (!bundleId) throw Error("Bundle ID required");

    const bundleData = await getBundle(API_URL, API_TOKEN, bundleId);

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });

    const checkout = await stripe.checkout.sessions.create({
        success_url: SUCCESS_URL,
        cancel_url: CANCEL_URL,
        mode: "payment",
        customer_creation: "if_required",
        shipping_address_collection: { allowed_countries: ["AU"] },
        shipping_options: bundleData.shippingRates.map((rate) => ({
            shipping_rate_data: {
                display_name: rate.name,
                type: "fixed_amount",
                delivery_estimate:
                    rate.minimumEstimatedDeliveryTime && rate.maximumEstimatedDeliveryTime
                        ? { minimum: { unit: "business_day", value: rate.minimumEstimatedDeliveryTime }, maximum: { unit: "business_day", value: rate.maximumEstimatedDeliveryTime } }
                        : undefined,
                fixed_amount: { amount: rate.price, currency: "AUD" },
                tax_behavior: "inclusive",
            },
        })),
        line_items: bundleData.bundleItems.map((item) => ({
            quantity: item.quantity,
            price_data: {
                currency: "AUD",
                product_data: {
                    name: item.product.name,
                    description: item.product.descriptionShort,
                    images: item.product.images,
                },
                unit_amount: item.unitPrice,
                tax_behavior: "inclusive",
            },
        })),
        automatic_tax: { enabled: true },
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
