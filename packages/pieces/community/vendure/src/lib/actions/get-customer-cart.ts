import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosResponse } from 'axios';
 
type CartLine = {
  id: string;
  linePriceWithTax: number;
  quantity: number;
  productVariant: {
    id: string;
    name: string;
    priceWithTax: number;
    currencyCode: string;
    featuredAsset?: {
      preview: string;
    };
  };
};
 
type ActiveOrderResponse = {
  data: {
    activeOrder: {
      id: string;
      lines: CartLine[];
      totalWithTax: number;
      totalQuantity: number;
      currencyCode: string;
    } | null;
  };
};
 
export const getCustomerCart = createAction({
  name: 'get_customer_cart',
  displayName: 'Get Customer Cart',
  description: 'Get active cart (order) of a logged-in customer from Vendure shop-api',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
      description: 'Example: https://singpet.universalcommerce.io',
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      required: true,
      description: 'The Vendure auth token returned from login',
    }),
  },
 
  async run(context) {
    const { vendureDomain, accessToken } = context.propsValue;
 
    const query = `
      query ActiveOrder {
        activeOrder {
          id
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
              currencyCode
            }
          }
          totalWithTax
          totalQuantity
          currencyCode
        }
      }
    `;
 
    try {
      const response: AxiosResponse<ActiveOrderResponse> = await axios.post(
        `${vendureDomain}/shop-api`,
        {
          query,
          variables: {},
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
 
      const activeOrder = response.data?.data?.activeOrder;
 
      if (!activeOrder) {
        return {
          success: false,
          message: 'No active order found for this customer.',
        };
      }
 
      return {
        success: true,
        cart: activeOrder,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  },
});