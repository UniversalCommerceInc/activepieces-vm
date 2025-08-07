import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const getCustomerDetails = createAction({
  name: 'get_customer_details',
  displayName: 'Get Customer Details',
  description: 'Fetch current customer info using Vendure Shop API token',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
      description: 'Example: https://singpet.universalcommerce.io',
    }),
    token: Property.ShortText({
      displayName: 'Customer Authentication Token',
      required: true,
      description: 'Enter customer token returned after login (customer auth token, NOT admin token)',
    }),
  },
  async run(context) {
    const { vendureDomain, token } = context.propsValue;

    const response = await axios.post(
      `${vendureDomain}/shop-api`,
      {
        query: `
          query {
            activeCustomer {
              id
              firstName
              lastName
              emailAddress
              phoneNumber
              addresses {
                id
                streetLine1
                city
                postalCode
                country {
                  code
                  name
                }
              }
              orders {
                items {
                  id
                  code
                  total
                  state
                }
              }
            }
          }
        `,
        variables: {},
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    // Returned data may be null if token invalid/expired
    return response.data.data.activeCustomer;
  },
});
