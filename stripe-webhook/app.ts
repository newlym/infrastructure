import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Stripe from "stripe";
import SNS from "aws-sdk/clients/sns";

const STRIPE_KEY = process.env.STRIPE_KEY as string;
const STRIPE_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;
const SNS_ARN = process.env.SNS_ARN as string;

export async function emitMessage(event: Stripe.Event, sns: SNS, snsARN: string) {
    const messageParams = { Message: "", TopicArn: snsARN };

    switch (event.type) {
        case "checkout.session.completed":
            messageParams.Message = JSON.stringify(event.data.object);
            break;
        default:
            throw Error("Invalid event");
    }

    await sns.publish(messageParams).promise();
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const whSignature = event.headers["stripe-signature"];
    if (!whSignature) throw Error("Webhook signature missing");

    const sns = new SNS({ apiVersion: "2010-03-31" });
    const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2020-08-27" });

    const stripeEvent = stripe.webhooks.constructEvent(event.body as string, whSignature, STRIPE_WEBHOOK_SECRET);

    await emitMessage(stripeEvent, sns, SNS_ARN);

    return {
        statusCode: 200,
        body: "",
    };
};
