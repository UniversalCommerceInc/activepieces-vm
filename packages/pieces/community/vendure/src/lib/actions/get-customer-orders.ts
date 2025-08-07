import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosResponse } from 'axios';
 
type ProductVariant = {
  id: string;
  name: string;
  priceWithTax: number;
  featuredAsset?: {
    preview: string;
  };
};
 
type OrderLine = {
  id: string;
  linePriceWithTax: number;
  quantity: number;
  productVariant: ProductVariant;
};
 
type Order = {
  id: string;
  orderPlacedAt: string;
  totalWithTax: number;
  currencyCode: string;
  state: string;
  lines: OrderLine[];
};
 
type GetAllOrdersResponse = {
  data: {
    activeCustomer: {
      orders: {
        items: Order[];
      };
    } | null;
  };
};
 
export const getAllOrders = createAction({
  name: 'get_all_orders',
  displayName: 'Get All Orders',
  description: 'Fetch all orders for the active customer',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      required: true,
    }),
  },
 
  async run(context) {
    const { vendureDomain, accessToken } = context.propsValue;
 
    const query = `
      query ActiveCustomer($options: OrderListOptions) {
        activeCustomer {
          orders(options: $options) {
            items {
              id
              orderPlacedAt
              totalWithTax
              currencyCode
              state
              lines {
                id
                linePriceWithTax
                quantity
                productVariant {
                  id
                  name
                  priceWithTax
                  featuredAsset {
                    preview
                  }
                }
              }
            }
          }
        }
      }
    `;
 
    const variables = {
      options: {
        filter: {
          active: {
            eq: false,
          },
        },
        sort: {
          id: 'DESC',
        },
      },
    };
 
    try {
      const response: AxiosResponse<GetAllOrdersResponse> = await axios.post(
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
 
      const orders = response.data?.data?.activeCustomer?.orders?.items || [];
 
      return {
        success: true,
        orders,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  },
});