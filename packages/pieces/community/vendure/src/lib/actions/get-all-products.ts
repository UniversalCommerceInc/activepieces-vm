import { PieceAuth, createPiece, Property, createAction } from '@activepieces/pieces-framework';
import axios from 'axios';

// Define an action to get all products
export const getAllProducts = createAction({
  name: 'get_all_products',
  displayName: 'Get All Products',
  description: 'Fetch all products from the specified Vendure domain.',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Domain URL',
      description: 'Please enter your Vendure API domain URL, e.g., https://myvendure.com',
      required: true,
    }),
  },
  async run(context) {
    const domain = context.propsValue.vendureDomain;
    
    // Make a GET request to the Vendure API to fetch products
    const response = await axios.post(`${domain}/shop-api`, {
      query: `
        query {
          products {
            items {
              id
              slug
              name
              description
              variants {
                id
                sku
                price
              }
            }
          }
        }
      `,
    });
    
    // Return products data
    return response.data.data.products.items;
  },
});

// export const vendure = createPiece({
//   displayName: 'Vendure',
//   logoUrl: 'https://vendure.io/logo.svg', // Use appropriate logo URL
//   auth: PieceAuth.None(), // You can add Vendure authentication here later if needed
//   actions: [getAllProducts],
//   triggers: [],
//   authors: [],
// });
