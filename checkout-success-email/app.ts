import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";

const MAILCHIMP_REGION = process.env.MAILCHIMP_REGION as string;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY as string;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID as string;
const MANDRILL_TEMPLATE_ID = process.env.MANDRILL_TEMPLATE_ID as string;
const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY as string;

export async function subscribeEmail(email: string, region: string, listId: string, apiKey: string) {
    const subscribeUrl = `https://${region}.api.mailchimp.com/3.0/lists/${listId}`;
    await axios.post(
        subscribeUrl,
        {
            members: [
                {
                    email_address: email,
                    status: "subscribed",
                },
            ],
        },
        { headers: { Authorization: `auth ${apiKey}` } }
    );
}

export async function sendThankYouEmail(email: string, templateId: string, apiKey: string) {
    const transactionalUrl = "https://mandrillapp.com/api/1.0/messages/send-template";
    const out = await axios.post(transactionalUrl, {
        key: apiKey,
        template_name: templateId,
        template_content: [],
        message: { subject: "Thanks For Purchasing", from_email: "notifications@newlym.com", from_name: "NewLym", to: [{ email: "notifications@newlym.com" }] },
    });
    console.log(out.data);
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

    // await subscribeEmail("bengrantalbertosborn@gmail.com", MAILCHIMP_REGION, MAILCHIMP_LIST_ID, MAILCHIMP_API_KEY);
    await sendThankYouEmail("bengrantalbertosborn@gmail.com", MANDRILL_TEMPLATE_ID, MANDRILL_API_KEY);

    return {
        batchItemFailures,
    };
};

lambdaHandler({} as any);
