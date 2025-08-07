import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosResponse } from 'axios';
 
type VendureOrderResponse = {
  data: {
    order: {
      id: string;
      orderPlacedAt: string;
      subTotalWithTax: number;
      shippingWithTax: number;
      totalWithTax: number;
      currencyCode: string;
      state: string;
      lines: Array<{
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
      }>;
      shippingAddress: Address;
      billingAddress: Address;
    } | null;
  };
};
 
type Address = {
  fullName: string;
  phoneNumber: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: string;
  country: string;
};
 
export const getOrderById = createAction({
  name: 'get_order_by_id',
  displayName: 'Get Order by ID',
  description: 'Get details of a specific order using its ID',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      required: true,
    }),
    orderId: Property.Number({
      displayName: 'Order ID',
      required: true,
    }),
  },
 
  async run(context) {
    const { vendureDomain, accessToken, orderId } = context.propsValue;
 
    const query = `
      query {
        order(id: ${orderId}) {
          id
          orderPlacedAt
          subTotalWithTax
          shippingWithTax
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
              currencyCode
              featuredAsset {
                preview
              }
            }
          }
          shippingAddress {
            fullName
            phoneNumber
            streetLine1
            streetLine2
            city
            province
            postalCode
            countryCode
            country
          }
          billingAddress {
            fullName
            phoneNumber
            streetLine1
            streetLine2
            city
            province
            postalCode
            countryCode
            country
          }
        }
      }
    `;
 
    try {
      const response: AxiosResponse<VendureOrderResponse> = await axios.post(
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
 
      const order = response.data?.data?.order;
 
      if (!order) {
        return {
          success: false,
          message: `Order with ID ${orderId} not found.`,
        };
      }
 
      return {
        success: true,
        order,
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.response?.data?.errors?.[0]?.message || error.message || 'Unknown error occurred',
      };
    }
  },
});