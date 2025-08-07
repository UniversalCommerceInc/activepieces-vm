import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const adminLogin = createAction({
  name: 'admin_login',
  displayName: 'Admin Login',
  description: 'Login to Vendure Admin and get token',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Domain URL',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
  async run(context) {
    const { vendureDomain, username, password } = context.propsValue;

    const response = await axios.post(
      `${vendureDomain}/admin-api`,
      {
        query: `
          mutation {
            login(username: "${username}", password: "${password}", rememberMe: true) {
              ... on CurrentUser {
                id
                identifier
                channels {
                  id
                  token
                  code
                  permissions
                }
              }
            }
          }
        `,
        variables: {}
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Extract channel token from response data
    const channels = response.data.data.login.channels;
    const token = channels.length > 0 ? channels[0].token : null;

    // Extract vendure-auth-token from response headers (case-insensitive)
    // In Node/axios, header keys are always lowercase
    const vendureAuthToken = response.headers['vendure-auth-token'] || null;

    // Return all!
    return {
      token,
      channels,
      vendureAuthToken,
    };
  },
});
