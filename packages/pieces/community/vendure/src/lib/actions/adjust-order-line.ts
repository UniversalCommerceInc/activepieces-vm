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
 
type AdjustOrderLineResponse = {
  data: {
    adjustOrderLine:
      | Order
      | {
          errorCode: string;
          message: string;
          quantityAvailable?: number;
          maxItems?: number;
        };
  };
};
 
export const adjustOrderLine = createAction({
  name: 'adjust_order_line',
  displayName: 'Adjust Order Line Quantity',
  description: 'Adjust the quantity of an item in the customer’s cart',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      required: true,
    }),
    orderLineId: Property.ShortText({
      displayName: 'Order Line ID',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'New Quantity',
      required: true,
    }),
  },
 
  async run(context) {
    const {
      vendureDomain,
      accessToken,
      orderLineId,
      quantity,
    } = context.propsValue;
 
    const query = `
      mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
        adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
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
          ... on OrderModificationError {
            errorCode
            message
          }
          ... on OrderLimitError {
            errorCode
            message
            maxItems
          }
          ... on NegativeQuantityError {
            errorCode
            message
          }
          ... on InsufficientStockError {
            errorCode
            message
            quantityAvailable
          }
        }
      }
    `;
 
    const variables = {
      orderLineId,
      quantity,
    };
 
    try {
      const response: AxiosResponse<AdjustOrderLineResponse> = await axios.post(
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
 
      const result = response.data?.data?.adjustOrderLine;
 
      if ('errorCode' in result) {
        return {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
          quantityAvailable: result.quantityAvailable,
          maxItems: result.maxItems,
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