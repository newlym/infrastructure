import axios from "axios";

export async function getBundle(apiUrl: string, apiToken: string, bundleId: string) {
    const populateBundleItems = "populate[bundleItems][populate][product][populate][images][populate]=%2A";
    const populateShippingRates = "populate[shipping_rates][populate]=%2A";

    const {
        data: {
            data: { attributes },
        },
    } = await axios.get(`${apiUrl}/api/bundles/${bundleId}?${populateBundleItems}&${populateShippingRates}`, {
        headers: { Authorization: `Bearer ${apiToken}` },
    });

    const shippingRates = attributes.shipping_rates.data.map((rate: any) => ({
        name: rate.attributes.name,
        minimumEstimatedDeliveryTime: rate.attributes.minimumEstimatedDeliveryTime,
        maximumEstimatedDeliveryTime: rate.attributes.maximumEstimatedDeliveryTime,
        price: parseInt(rate.attributes.price),
    }));

    const bundleItems = attributes.bundleItems.map(
        (item: any) =>
            new Promise(async (resolve) =>
                resolve({
                    product: {
                        name: item.product.data.attributes.name,
                        descriptionShort: item.product.data.attributes.descriptionShort,
                        images: item.product.data.attributes.images.data.map((img: any) => img.attributes.url),
                    },
                    unitPrice: item.unitPrice,
                    quantity: item.quantity,
                })
            )
    );

    return {
        bundleItems,
        shippingRates,
    } as {
        bundleItems: { product: { name: string; descriptionShort: string; images: string[] }; unitPrice: number; quantity: number }[];
        shippingRates: { name: string; minimumEstimatedDeliveryTime: number | null; maximumEstimatedDeliveryTime: number | null; price: number }[];
    };
}
