import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const registerCustomerAccount = createAction({
  name: 'register_customer_account',
  displayName: 'Register Customer Account',
  description: 'Register a new customer via Vendure shop-api using RegisterCustomerInput',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Shop API Domain URL',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  },
  async run(context) {
    const {
      vendureDomain,
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      title,
    } = context.propsValue;

    // RegisterCustomerInput structure:
    // emailAddress, title, firstName, lastName, phoneNumber, password

    const query = `
      mutation RegisterCustomerAccount($input: RegisterCustomerInput!) {
        registerCustomerAccount(input: $input) {
          ... on Success {
            success
          }
          ... on MissingPasswordError {
            errorCode
            message
          }
          ... on PasswordValidationError {
            errorCode
            message
          }
          ... on NativeAuthStrategyError {
            errorCode
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        emailAddress: email,
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
        password,
        title: title || undefined,
      },
    };

    try {
      const response = await axios.post(
        `${vendureDomain}/shop-api`,
        {
          query,
          variables,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      const res = response.data?.data?.registerCustomerAccount;

      // Parse the union result
      if (!res) {
        return {
          success: false,
          message: response.data?.errors?.[0]?.message || 'Unknown error',
        };
      }

      if ('success' in res && res.success === true) {
        return { success: true, message: 'Registration successful' };
      } else {
        // Error variant
        return {
          success: false,
          errorCode: res.errorCode,
          message: res.message,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.errors?.[0]?.message || error.message,
      };
    }
  },
});
