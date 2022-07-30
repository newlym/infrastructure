import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import sgClient from "@sendgrid/client";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
const SENDGRID_LIST_ID = process.env.SENDGRID_LIST_ID as string;

sgMail.setApiKey(SENDGRID_API_KEY);
sgClient.setApiKey(SENDGRID_API_KEY);

export async function sendEmail(checkoutSession: Stripe.Checkout.Session, listId: string) {
    const titleText = `${checkoutSession.customer_details?.name || ""} ${checkoutSession.amount_total ? "$" + (checkoutSession.amount_total / 100).toFixed(2) + " AUD" : ""}`;

    const contacts = await sgClient.request({
        url: `/v3/marketing/contacts/search`,
        method: "POST",
        body: {
            query: `CONTAINS(list_ids, '${listId}')`,
        },
    });
    const to = contacts[1].result.map((res: any) => res.email);

    const message = JSON.stringify(checkoutSession);

    await sgMail.send({
        to,
        from: "orders@newlym.com",
        subject: titleText,
        text: message,
        html: message,
    });
}

export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    for (const record of event.Records) {
        const checkoutSession: Stripe.Checkout.Session = JSON.parse(JSON.parse(record.body).Message);
        await sendEmail(checkoutSession, SENDGRID_LIST_ID);
    }

    return {
        batchItemFailures: [],
    };
};
