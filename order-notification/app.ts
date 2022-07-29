import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import Stripe from "stripe";
import { Client } from "@notionhq/client";

const NOTION_KEY = process.env.NOTION_KEY as string;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

export async function notifyOrder(checkoutSession: Stripe.Checkout.Session, notion: Client, databaseId: string) {
    const titleText = `${checkoutSession.customer_details?.name || ""} ${checkoutSession.amount_total ? "$ " + (checkoutSession.amount_total / 100).toFixed(2) + " AUD" : ""}`;

    await notion.pages.create({
        parent: { database_id: databaseId },
        properties: { Name: [{ text: { content: titleText } }], Status: { name: "Backlog" } },
        children: [{ paragraph: { rich_text: [{ text: { content: JSON.stringify(checkoutSession) } }] } }],
    });
}

export const lambdaHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    const notion = new Client({ auth: NOTION_KEY });

    const batchItemFailures: { itemIdentifier: string }[] = [];
    await Promise.all(
        event.Records.map(
            (record) =>
                new Promise(async (resolve) => {
                    try {
                        const checkoutSession: Stripe.Checkout.Session = JSON.parse(JSON.parse(record.body).Message);
                        await notifyOrder(checkoutSession, notion, NOTION_DATABASE_ID);
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
