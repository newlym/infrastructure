import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import SNS from "aws-sdk/clients/sns";

const STRIPE_KEY = process.env.STRIPE_KEY as string;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;
const TOPIC_ARN = process.env.TOPIC_ARN as string;

export async function emitMessage(event: Stripe.Event, sns: SNS, topicARN: string) {
    if (event.type !== "checkout.session.completed") throw Error("Invalid event");

    await sns.publish({ Message: JSON.stringify(event.data.object), TopicArn: topicARN }).promise();
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const whSignature = event.headers["Stripe-Signature"];
    if (!whSignature) throw Error("Webhook signature missing");

    const sns = new SNS({ apiVersion: "2010-03-31" });
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });

    const stripeEvent = stripe.webhooks.constructEvent(event.body as string, whSignature, STRIPE_WEBHOOK_SECRET);

    await emitMessage(stripeEvent, sns, TOPIC_ARN);

    return {
        statusCode: 200,
        body: "",
    };
};
