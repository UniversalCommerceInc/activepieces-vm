import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

// Define an action to get all categories
export const getAllCategories = createAction({
  name: 'get_all_categories',
  displayName: 'Get All Categories',
  description: 'Fetch all categories from the specified Vendure domain.',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Domain URL',
      description: 'Please enter your Vendure API domain URL, e.g., https://myvendure.com',
      required: true,
    }),
  },
  async run(context) {
    const domain = context.propsValue.vendureDomain;

    // Make a POST request to the Vendure API to fetch categories
    const response = await axios.post(`${domain}/shop-api`, {
      query: `
        query {
          collections {
            items {
              id
              name
              slug
              description
              parent {
                id
                name
              }
            }
          }
        }
      `,
    });

    // Return categories data
    return response.data.data.collections.items;
  },
});
