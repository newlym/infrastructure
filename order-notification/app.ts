import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import Stripe from "stripe";
import { Client } from "@notionhq/client";

const NOTION_KEY = process.env.NOTION_KEY as string;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID as string;

export async function notifyOrder(notion: Client, databaseId: string) {
    await notion.pages.create({
        parent: { database_id: databaseId },
        properties: { Name: [{ text: { content: "LB7" } }], Status: { name: "Backlog" } },
        children: [{ paragraph: { rich_text: [{ text: { content: "LB7 2" } }] } }],
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
                        console.log(JSON.parse(record.body));
                        // await notifyOrder(notion, NOTION_DATABASE_ID);
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
