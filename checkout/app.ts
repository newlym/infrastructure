import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import DynamoDB from "aws-sdk/clients/dynamodb";
import Stripe from "stripe";

const TABLE_NAME = process.env.TABLE_NAME as string;
const STRIPE_KEY = process.env.STRIPE_KEY as string;

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const checkoutId = event.pathParameters?.checkoutId;

    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });
    const dynamo = new DynamoDB.DocumentClient();

    const response = await dynamo.get({ Key: { checkoutId }, TableName: TABLE_NAME }).promise();

    const checkoutConfig = JSON.parse(response.Item?.value);
    const checkout = await stripe.checkout.sessions.create(checkoutConfig);

    if (!checkout.url)
        return {
            statusCode: 500,
            body: "Error",
        };

    return {
        statusCode: 302,
        headers: {
            Location: checkout.url,
        },
        body: checkout.url,
    };
};
