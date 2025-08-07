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
 
type OrderResponse = {
  id: string;
  lines: OrderLine[];
  totalWithTax: number;
  totalQuantity: number;
  currencyCode: string;
};
 
type OrderModificationError = {
  errorCode: string;
  message: string;
};
 
type RemoveOrderLineResponse = {
  data: {
    removeOrderLine: OrderResponse | OrderModificationError;
  };
};
 
export const removeOrderLine = createAction({
  name: 'remove_order_line',
  displayName: 'Remove Order Line',
  description: 'Removes an order line from the customer\'s active cart',
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
  },
 
  async run(context) {
    const { vendureDomain, accessToken, orderLineId } = context.propsValue;
 
    const query = `
      mutation Mutation($orderLineId: ID!) {
        removeOrderLine(orderLineId: $orderLineId) {
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
        }
      }
    `;
 
    const variables = {
      orderLineId,
    };
 
    try {
      const response: AxiosResponse<RemoveOrderLineResponse> = await axios.post(
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
 
      const result = response.data?.data?.removeOrderLine;
 
      if ('errorCode' in result) {
        return {
          success: false,
          errorCode: result.errorCode,
          message: result.message,
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