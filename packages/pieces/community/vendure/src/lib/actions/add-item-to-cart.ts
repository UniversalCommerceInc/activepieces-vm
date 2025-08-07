import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosResponse } from 'axios';
 
type ProductVariant = {
  id: string;
  name: string;
  priceWithTax: number;
  currencyCode: string;
  assets?: { preview: string }[];
  product?: { assets?: { preview: string }[] };
};
 
type OrderLine = {
  id: string;
  linePriceWithTax: number;
  quantity: number;
  productVariant: ProductVariant;
};
 
type Order = {
  id: string;
  lines: OrderLine[];
  totalWithTax: number;
  totalQuantity: number;
  currencyCode: string;
};
 
type AddItemResponse = {
  data: {
    addItemToOrder: Order;
  };
};
 
export const addItemToOrder = createAction({
  name: 'add_item_to_order',
  displayName: 'Add Item to Cart',
  description: 'Add a product variant to the customer’s active order/cart on Vendure',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      required: true,
    }),
    productVariantId: Property.ShortText({
      displayName: 'Product Variant ID',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: true,
      defaultValue: 1,
    }),
  },
 
  async run(context) {
    const {
      vendureDomain,
      accessToken,
      productVariantId,
      quantity,
    } = context.propsValue;
 
    const query = `
      mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
        addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
          ... on Order {
            id
            lines {
              id
              linePriceWithTax
              quantity
              productVariant {
                id
                name
                priceWithTax
                currencyCode
                assets {
                  preview
                }
                product {
                  assets {
                    preview
                  }
                }
              }
            }
            totalWithTax
            totalQuantity
            currencyCode
          }
        }
      }
    `;
 
    const variables = {
      productVariantId,
      quantity,
    };
 
    try {
      const response: AxiosResponse<AddItemResponse> = await axios.post(
        `${vendureDomain}/shop-api`,
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
 
      const result = response.data?.data?.addItemToOrder;
 
      if (!result) {
        return {
          success: false,
          message: 'Failed to add item to order. Check variant ID or quantity.',
        };
      }
 
      return {
        success: true,
        updatedOrder: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  },
});