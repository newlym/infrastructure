import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import S3 from "aws-sdk/clients/dynamodb";

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "some error happened",
        }),
    };
};
