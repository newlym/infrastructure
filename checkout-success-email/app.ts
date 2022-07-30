import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import axios from "axios";
import Stripe from "stripe";

const MAILCHIMP_REGION = process.env.MAILCHIMP_REGION as string;
const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY as string;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID as string;
const MANDRILL_TEMPLATE_NAME = process.env.MANDRILL_TEMPLATE_NAME as string;
const MANDRILL_API_KEY = process.env.MANDRILL_API_KEY as string;

export async function updateEmail(checkoutSession: Stripe.Checkout.Session, region: string, listId: string, apiKey: string) {
    const email = checkoutSession.customer_details?.email;
    if (!email) return;

    const subscribeUrl = `https://${region}.api.mailchimp.com/3.0/lists/{list_id}`;
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

    // const transactionalUrl = "https://mandrillapp.com/api/1.0/messages/send-template";
    // await axios.post(transactionalUrl, {});

    //     curl -X POST \
    //   https://mandrillapp.com/api/1.0/messages/send-template \
    //   -d '{"key":"","template_name":"","template_content":[],"message":{"html":"","text":"","subject":"","from_email":"","from_name":"","to":[],"headers":{},"important":false,"track_opens":false,"track_clicks":false,"auto_text":false,"auto_html":false,"inline_css":false,"url_strip_qs":false,"preserve_recipients":false,"view_content_link":false,"bcc_address":"","tracking_domain":"","signing_domain":"","return_path_domain":"","merge":false,"merge_language":"mailchimp","global_merge_vars":[],"merge_vars":[],"tags":[],"subaccount":"","google_analytics_domains":[],"google_analytics_campaign":"","metadata":{"website":""},"recipient_metadata":[],"attachments":[],"images":[]},"async":false,"ip_pool":"","send_at":""}'
}

export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const batchItemFailures: { itemIdentifier: string }[] = [];
    await Promise.all(
        event.Records.map(
            (record) =>
                new Promise(async (resolve) => {
                    try {
                        // const checkoutSession: Stripe.Checkout.Session = JSON.parse(JSON.parse(record.body).Message);
                        await updateEmail({} as any, MAILCHIMP_REGION, MAILCHIMP_LIST_ID, MAILCHIMP_API_KEY);
                    } catch {
                        batchItemFailures.push({ itemIdentifier: record.messageId });
                    }
                })
        )
    );

    return {
        batchItemFailures,
    };
};

lambdaHandler({} as any);
