import { createAction, Property } from '@activepieces/pieces-framework';
import axios, { AxiosResponse } from 'axios';
 
type Channel = {
  id: string;
  token: string;
};
 
type LoginSuccessResponse = {
  id: string;
  identifier: string;
  channels: Channel[];
};
 
type LoginErrorResponse = {
  errorCode: string;
  message: string;
  authenticationError?: string;
};
 
type GraphQLResponse = {
  data: {
    login: LoginSuccessResponse | LoginErrorResponse;
  };
};
 
export const customerLogin = createAction({
  name: 'customer_login',
  displayName: 'Customer Login',
  description: 'Login as customer on Vendure shop-api and get user info & token',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
      description: 'Example: https://singpet.universalcommerce.io',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
 
  async run(context) {
    const { vendureDomain, email, password } = context.propsValue;
 
    try {
      const response: AxiosResponse<GraphQLResponse> = await axios.post(
        `${vendureDomain}/shop-api`,
        {
          query: `
            mutation Login($email: String!, $password: String!) {
              login(username: $email, password: $password) {
                ... on CurrentUser {
                  id
                  identifier
                  channels {
                    id
                    token
                  }
                }
                ... on InvalidCredentialsError {
                  errorCode
                  message
                  authenticationError
                }
                ... on NotVerifiedError {
                  errorCode
                  message
                }
              }
            }
          `,
          variables: {
            email,
            password,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
 
      const loginData = response.data.data.login;
      const authToken = response.headers['vendure-auth-token'];
 
      if ('errorCode' in loginData) {
        return {
          success: false,
          errorCode: loginData.errorCode,
          message: loginData.message,
        };
      }
 
      return {
        success: true,
        token: authToken,
        email: loginData.identifier,
        channels: loginData.channels,
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.errors?.[0]?.message || error.message || 'Unknown error';
      return {
        success: false,
        message,
      };
    }
  },
});