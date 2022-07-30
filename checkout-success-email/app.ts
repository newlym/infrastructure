import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import sgClient from "@sendgrid/client";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
const SENDGRID_LIST_ID = process.env.SENDGRID_LIST_ID as string;
const SENDGRID_TEMPLATE_ID = process.env.SENDGRID_TEMPLATE_ID as string;

sgMail.setApiKey(SENDGRID_API_KEY);
sgClient.setApiKey(SENDGRID_API_KEY);

export async function subscribeEmail(email: string, listId: string) {
    await sgClient.request({
        url: `/v3/marketing/contacts`,
        method: "PUT",
        body: {
            contacts: [
                {
                    email,
                    custom_fields: {
                        w1_T: "yes", // paying
                        w2_D: new Date(), // recent_purchase
                        w3_T: "no", // active_cart
                    },
                },
            ],
            list_ids: [listId],
        },
    });
}

export async function sendEmail(email: string, templateId: string) {
    await sgMail.send({
        to: email,
        from: "notifications@newlym.com",
        templateId,
    });
}

export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    for (const record of event.Records) {
        const checkoutSession: Stripe.Checkout.Session = JSON.parse(JSON.parse(record.body).Message);

        const email = checkoutSession.customer_details?.email;
        if (!email) continue;

        await subscribeEmail(email, SENDGRID_LIST_ID);
        await sendEmail(email, SENDGRID_TEMPLATE_ID);
    }

    return {
        batchItemFailures: [],
    };
};
