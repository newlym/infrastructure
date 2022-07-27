import { lambdaHandler } from "./app";

async function main() {
    console.log(await lambdaHandler({ pathParameters: { bundleId: 1 } } as any));
}

main();
