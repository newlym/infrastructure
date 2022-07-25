import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import S3 from "aws-sdk/clients/s3";

import { handleExisting, handleResize } from "./utils";

const s3 = new S3({ apiVersion: "2006-03-01" });

const RAW_IMAGE_BUCKET = process.env.RAW_IMAGE_BUCKET as string;
const RESIZED_IMAGE_BUCKET = process.env.RESIZED_BUCKET as string;

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const fileName = event.pathParameters?.file;
    const size = event.queryStringParameters?.size;

    if (!fileName) throw Error("No file name provided");
    if (!size) return await handleExisting(fileName, RAW_IMAGE_BUCKET, s3);

    const resizedKey = size + "." + fileName;

    try {
        return await handleExisting(resizedKey, RESIZED_IMAGE_BUCKET, s3);
    } catch {
        const split = size.split("x");

        return await handleResize(fileName, resizedKey, { width: parseInt(split[0]), height: parseInt(split[1]) }, RAW_IMAGE_BUCKET, RESIZED_IMAGE_BUCKET, s3);
    }
};
