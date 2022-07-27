import axios from "axios";

export async function getBundle(apiUrl: string, apiToken: string, bundleId: string) {
    const {
        data: {
            data: { attributes },
        },
    } = await axios.get(`${apiUrl}/api/bundles/${bundleId}?populate=%2A`, { headers: { Authorization: `Bearer ${apiToken}` } });

    const shippingRates = attributes.shipping_rates.data.map((rate: any) => ({
        name: rate.attributes.name,
        minimumEstimatedDeliveryTime: rate.attributes.minimumEstimatedDeliveryTime,
        maximumEstimatedDeliveryTime: rate.attributes.maximumEstimatedDeliveryTime,
        price: parseInt(rate.attributes.price),
    }));

    const bundlesPromise = attributes.bundleItems.map(
        (item: any) =>
            new Promise(async (resolve) =>
                resolve({
                    product: await getProduct(apiUrl, apiToken, item.id),
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                })
            )
    );
    const bundleItems = await Promise.all(bundlesPromise);

    return {
        bundleItems,
        shippingRates,
    } as {
        bundleItems: { product: { name: string; descriptionShort: string; images: string[] }; unitPrice: number; quantity: number }[];
        shippingRates: { name: string; minimumEstimatedDeliveryTime: number | null; maximumEstimatedDeliveryTime: number | null; price: number }[];
    };
}

async function getProduct(apiUrl: string, apiToken: string, productId: string) {
    const {
        data: {
            data: { attributes },
        },
    } = await axios.get(`${apiUrl}/api/products/${productId}?populate=%2A`, { headers: { Authorization: `Bearer ${apiToken}` } });

    return { name: attributes.name, descriptionShort: attributes.descriptionShort, images: attributes.images.data.map((img: any) => img.attributes.url) } as {
        name: string;
        descriptionShort: string;
        images: string[];
    };
}
