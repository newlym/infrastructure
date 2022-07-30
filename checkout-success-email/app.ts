import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import Stripe from "stripe";
import sgMail from "@sendgrid/mail";
import sgClient from "@sendgrid/client";

// const MAILCHIMP_REGION = process.env.MAILCHIMP_REGION as string;
// const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY as string;
// const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID as string;
// const MANDRILL_TEMPLATE_ID = process.env.MANDRILL_TEMPLATE_ID as string;
// const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY as string;

const SENDGRID_API_KEY = "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";
const SENDGRID_LIST_ID = "d2a11c99-e426-4c04-9451-422371be1785";
const SENDGRID_TEMPLATE_ID = "d-6d921a94d3794b06a679cd2b939e433b";

sgMail.setApiKey(SENDGRID_API_KEY);
sgClient.setApiKey(SENDGRID_API_KEY);

export async function subscribeEmail(email: string, listId: string) {
    try {
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
    } catch (e: any) {
        console.log(e.response.body.errors);
        console.log();
        console.log(e);
    }
}

export async function sendThankYouEmail(email: string, templateId: string) {
    await sgMail.send({
        to: email,
        from: "notifications@newlym.com",
        templateId,
    });
}

export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];
    // await Promise.all(
    //     event.Records.map(
    //         (record) =>
    //             new Promise(async (resolve) => {
    //                 try {
    //                     // const checkoutSession: Stripe.Checkout.Session = JSON.parse(JSON.parse(record.body).Message);
    //                     await updateEmail({} as any, MAILCHIMP_REGION, MAILCHIMP_LIST_ID, MAILCHIMP_API_KEY);
    //                 } catch {
    //                     batchItemFailures.push({ itemIdentifier: record.messageId });
    //                 }
    //             })
    //     )
    // );

    await subscribeEmail("bengrantalbertosborn@gmail.com", SENDGRID_LIST_ID);
    // await sendThankYouEmail("bengrantalbertosborn@gmail.com", SENDGRID_TEMPLATE_ID);

    return {
        batchItemFailures,
    };
};

lambdaHandler({} as any);
