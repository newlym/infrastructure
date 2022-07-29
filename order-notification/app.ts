import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
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

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log(event);

    const notion = new Client({ auth: NOTION_KEY });

    await notifyOrder(notion, NOTION_DATABASE_ID);

    return {
        statusCode: 200,
        body: "",
    };
};
