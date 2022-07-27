import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";

import { getBundle } from "./utils";

// const STRIPE_KEY = process.env.STRIPE_KEY as string;
const STRIPE_KEY = "sk_test_51LOh2yJxHXEJe42jWjM7il59jLG1jTNj7Ah78XjzFy2dtcZoRkBdchHAVUHOYPs0sugZDtzAX0eTDPhz34ELuv2R00QXlCb3am";
const API_URL = "https://cms-j25hmdlpya-ts.a.run.app";
const API_TOKEN =
    "ca2f68700e63a79ad286d04ef99892f0770b6672c7837fb5f4061fc931e13891fc3fa1bb725acaa6361bbf763bb29cfccdd281836aa9d3de012c59b86f2b1e4281563853ccf833752ebdc75306b3d2e4f83c4efc4a665bae604027fd3a3c43d28d63b202f110e90b4056a36609223baba0152f4ff9cb3d619abce7b93bf12e78";
const SUCCESS_URL = "https://www.newlymphclinic.com.au/checkout-success";
const CANCEL_URL = "https://www.newlymphclinic.com.au/checkout-failed";

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const bundleId = event.pathParameters?.bundleId;

    if (!bundleId) throw Error("Bundle ID required");

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });
    const bundleData = await getBundle(API_URL, API_TOKEN, bundleId);

    // **** I need to add tax for this

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
            },
        })),
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
