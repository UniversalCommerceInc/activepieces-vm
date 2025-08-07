import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';
 
// Types for better type safety
type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; extensions?: any }[];
};
 
type ValidationError = {
  field: string;
  message: string;
};
 
type CheckoutResult = {
  success: boolean;
  order?: any;
  message?: string;
  validationErrors?: ValidationError[];
};
 
export const checkout = createAction({
  name: 'checkout',
  displayName: 'Checkout',
  description: 'Performs full checkout by setting shipping method, addresses, order state, and adding payment. Optimized with parallel execution and production-grade validation.',
  props: {
    vendureDomain: Property.ShortText({
      displayName: 'Vendure Domain',
      required: true,
      description: 'Full domain URL (e.g., https://your-shop.com)'
    }),
    accessToken: Property.ShortText({
      displayName: 'Customer Access Token',
      required: true,
      description: 'Valid customer access token'
    }),
    isMultiVendor: Property.Checkbox({
      displayName: 'Is Multi Vendor',
      description: 'Check if the Vendure instance is multi-vendor',
      required: false,
      defaultValue: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
      description: 'Customer first name (2-50 characters)'
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
      description: 'Customer last name (2-50 characters)'
    }),
    streetLine1: Property.ShortText({
      displayName: 'Street Line 1',
      required: true,
      description: 'Primary address line (5-100 characters)'
    }),
    streetLine2: Property.ShortText({
      displayName: 'Street Line 2',
      required: false,
      description: 'Secondary address line (optional)'
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: true,
      description: 'City name (2-50 characters)'
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: true,
      description: 'State/Province (2-50 characters)'
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: true,
      description: 'Valid postal/ZIP code'
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      required: true,
      description: 'ISO 3166-1 alpha-2 country code (e.g., US, IN, GB)'
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: true,
      description: 'Valid phone number with country code'
    }),
    landmark: Property.ShortText({
      displayName: 'Company / Landmark',
      required: false,
      description: 'Company name or landmark (optional)'
    }),
    deliveryType: Property.ShortText({
      displayName: 'Delivery Type',
      description: 'Type of delivery: "pickup" or "ship" (case-insensitive), STRICTLY for multi-vendor checkout',
      required: false,
    }),
    shipMethodIds: Property.Array({
      displayName: 'Shipping Method IDs',
      description: 'List of valid shipping method IDs, STRICTLY for multi-vendor checkout',
      required: false,
    })
  },
 
  async run(context): Promise<CheckoutResult> {
    const {
      vendureDomain,
      accessToken,
      isMultiVendor,
      firstName,
      lastName,
      streetLine1,
      streetLine2,
      city,
      state,
      postalCode,
      countryCode,
      phoneNumber,
      landmark,
      deliveryType,
      shipMethodIds
    } = context.propsValue;
 
    // Production-grade input validation
    const validationErrors = validateInputs({
      vendureDomain,
      accessToken,
      firstName,
      lastName,
      streetLine1,
      streetLine2,
      city,
      state,
      postalCode,
      countryCode,
      phoneNumber,
      landmark,
      deliveryType,
      shipMethodIds,
      isMultiVendor
    });
 
    if (validationErrors.length > 0) {
      return {
        success: false,
        message: 'Validation failed',
        validationErrors
      };
    }
 
    const endpoint = normalizeEndpoint(vendureDomain);
    const method = isMultiVendor ? 'connected-payment-method' : 'standard-payment';
 
    const headers = {
      Authorization: `Bearer ${accessToken.trim()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ActivePieces-Vendure-Checkout/1.0'
    };
 
    const gqlRequest = async <T>(query: string, variables: any = {}): Promise<T> => {
      try {
        const response = await axios.post<GraphQLResponse<T>>(
          endpoint,
          { query: query.trim(), variables },
          {
            headers,
            timeout: 30000, // 30 second timeout
            validateStatus: (status) => status < 500 // Don't throw on 4xx errors
          }
        );
 
        if (response.data.errors?.length) {
          const error = response.data.errors[0];
          throw new Error(`GraphQL Error: ${error.message}${error.extensions ? ` (${JSON.stringify(error.extensions)})` : ''}`);
        }
 
        if (!response.data.data) {
          throw new Error('No data returned from GraphQL query');
        }
 
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new Error('Authentication failed. Please check your access token.');
          } else if (error.response?.status === 403) {
            throw new Error('Authorization failed. Insufficient permissions.');
          } else if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout. Please try again.');
          }
        }
        throw error;
      }
    };
 
    const formattedAddress = {
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      company: landmark?.trim() || '',
      streetLine1: streetLine1.trim(),
      streetLine2: streetLine2?.trim() || '',
      city: city.trim(),
      province: state.trim(),
      postalCode: postalCode.trim(),
      countryCode: countryCode.toUpperCase(),
      phoneNumber: phoneNumber.trim(),
    };
 
    try {
      const setShippingMethodMutation = `
        mutation SetShipping($shippingMethodIds: [ID!]!) {
          setOrderShippingMethod(shippingMethodId: $shippingMethodIds) {
            ... on Order {
              id
              createdAt
              updatedAt
              type
              orderPlacedAt
              code
              state
              active
              totalQuantity
              subTotal
              subTotalWithTax
              currencyCode
              shipping
              shippingWithTax
              total
              totalWithTax
            }
            ... on OrderModificationError {
              errorCode
              message
            }
            ... on IneligibleShippingMethodError {
              errorCode
              message
            }
            ... on NoActiveOrderError {
              errorCode
              message
            }
          }
        }
      `;
 
      const setDeliveryTypeMutation = `
        mutation SetOrderCustomFields($customFields: UpdateOrderCustomFieldsInput!) {
          setOrderCustomFields(input: { customFields: $customFields }) {
            ... on Order {
              id
              code
              customFields {
                deliveryType
              }
            }
            ... on NoActiveOrderError {
              errorCode
              message
            }
          }
        }
      `;
 
      // Step 1: Handle shipping method setup with validation
      if (!isMultiVendor) {
        const eligibleShippingQuery = `
          query {
            eligibleShippingMethods {
              id
              name
              price
            }
          }
        `;
        
        const shippingData = await gqlRequest<{ eligibleShippingMethods: { id: string; name: string; price: number }[] }>(
          eligibleShippingQuery
        );
        
        if (!shippingData.eligibleShippingMethods || shippingData.eligibleShippingMethods.length === 0) {
          throw new Error('No eligible shipping methods available for this order');
        }
        
        const shippingMethodIds = shippingData.eligibleShippingMethods.map((m) => m.id);
        await gqlRequest(setShippingMethodMutation, { shippingMethodIds });
        
      } else {
        // Multi-vendor: Run shipping method and delivery type updates in parallel
        const parallelOperations: Promise<any>[] = [];
 
        // Shipping method operation for multi-vendor
        if (shipMethodIds && Array.isArray(shipMethodIds) && shipMethodIds.length > 0) {
          const filteredShippingMethodIds = shipMethodIds
            .map(id => String(id).trim())
            .filter(id => id && id !== 'null' && id !== 'undefined');
 
          if (filteredShippingMethodIds.length > 0) {
            parallelOperations.push(
              gqlRequest(setShippingMethodMutation, { shippingMethodIds: filteredShippingMethodIds })
                .catch(error => {
                  throw new Error(`Shipping method setup failed: ${error.message}`);
                })
            );
          }
        }
 
        // Delivery type operation for multi-vendor
        if (deliveryType && ['pickup', 'ship'].includes(deliveryType.toLowerCase().trim())) {
          parallelOperations.push(
            gqlRequest(setDeliveryTypeMutation, {
              customFields: {
                deliveryType: deliveryType.toLowerCase().trim()
              }
            }).catch(error => {
              throw new Error(`Delivery type setup failed: ${error.message}`);
            })
          );
        }
 
        // Execute parallel operations if any exist
        if (parallelOperations.length > 0) {
          await Promise.all(parallelOperations);
        }
      }
 
      // Step 2: Define address mutation queries
      const setBillingAddressMutation = `
        mutation SetBilling($input: CreateAddressInput!) {
          setOrderBillingAddress(input: $input) {
            ... on Order { id }
            ... on ErrorResult { errorCode message }
          }
        }
      `;
 
      const setShippingAddressMutation = `
        mutation SetShippingAddress($input: CreateAddressInput!) {
          setOrderShippingAddress(input: $input) {
            ... on Order { id }
            ... on ErrorResult { errorCode message }
          }
        }
      `;
 
      // Step 3: Run address mutations in parallel with error handling
      await Promise.all([
        gqlRequest(setBillingAddressMutation, { input: formattedAddress })
          .catch(error => { throw new Error(`Billing address setup failed: ${error.message}`); }),
        gqlRequest(setShippingAddressMutation, { input: formattedAddress })
          .catch(error => { throw new Error(`Shipping address setup failed: ${error.message}`); }),
      ]);
 
      // Step 4: Transition order state
      const transitionMutation = `
        mutation {
          transitionOrderToState(state: "ArrangingPayment") {
            ... on Order { id state }
            ... on ErrorResult { errorCode message }
          }
        }
      `;
      
      await gqlRequest(transitionMutation)
        .catch(error => { throw new Error(`Order state transition failed: ${error.message}`); });
 
      // Step 5: Add payment
      const paymentMutation = `
        mutation AddPayment($method: String!, $meta JSON!) {
          addPaymentToOrder(input: { method: $method, meta $metadata }) {
            ... on Order {
              id code state totalWithTax customer { emailAddress }
            }
            ... on ErrorResult { errorCode message }
          }
        }
      `;
 
      const paymentResult = await gqlRequest<{ addPaymentToOrder: any }>(paymentMutation, {
        method,
        meta :{},
      }).catch(error => { throw new Error(`Payment processing failed: ${error.message}`); });
 
      return {
        success: true,
        order: paymentResult.addPaymentToOrder,
      };
 
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Vendure checkout failed due to an unexpected error',
      };
    }
  },
});
 
// Production-grade validation functions
function validateInputs(inputs: any): ValidationError[] {
  const errors: ValidationError[] = [];
 
  // Domain validation
  if (!inputs.vendureDomain || !isValidUrl(inputs.vendureDomain)) {
    errors.push({ field: 'vendureDomain', message: 'Valid domain URL is required (e.g., https://your-shop.com)' });
  }
 
  // Access token validation
  if (!inputs.accessToken || inputs.accessToken.trim().length < 10) {
    errors.push({ field: 'accessToken', message: 'Valid access token is required (minimum 10 characters)' });
  }
 
  // Name validations
  if (!inputs.firstName || !isValidName(inputs.firstName)) {
    errors.push({ field: 'firstName', message: 'First name must be 2-50 characters, letters only' });
  }
 
  if (!inputs.lastName || !isValidName(inputs.lastName)) {
    errors.push({ field: 'lastName', message: 'Last name must be 2-50 characters, letters only' });
  }
 
  // Address validations
  if (!inputs.streetLine1 || inputs.streetLine1.trim().length < 5 || inputs.streetLine1.trim().length > 100) {
    errors.push({ field: 'streetLine1', message: 'Street address must be 5-100 characters' });
  }
 
  if (inputs.streetLine2 && inputs.streetLine2.trim().length > 100) {
    errors.push({ field: 'streetLine2', message: 'Street line 2 must not exceed 100 characters' });
  }
 
  if (!inputs.city || !isValidCityState(inputs.city)) {
    errors.push({ field: 'city', message: 'City must be 2-50 characters, letters and spaces only' });
  }
 
  if (!inputs.state || !isValidCityState(inputs.state)) {
    errors.push({ field: 'state', message: 'State must be 2-50 characters, letters and spaces only' });
  }
 
  if (!inputs.postalCode || !isValidPostalCode(inputs.postalCode)) {
    errors.push({ field: 'postalCode', message: 'Valid postal code is required' });
  }
 
  if (!inputs.countryCode || !isValidCountryCode(inputs.countryCode)) {
    errors.push({ field: 'countryCode', message: 'Valid 2-letter country code is required (e.g., US, IN, GB)' });
  }
 
  if (!inputs.phoneNumber || !isValidPhoneNumber(inputs.phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: 'Valid phone number is required (10-15 digits with optional +)' });
  }
 
  if (inputs.landmark && inputs.landmark.trim().length > 100) {
    errors.push({ field: 'landmark', message: 'Company/landmark must not exceed 100 characters' });
  }
 
  // Multi-vendor specific validations
  if (inputs.isMultiVendor) {
    if (inputs.deliveryType && !['pickup', 'ship'].includes(inputs.deliveryType.toLowerCase().trim())) {
      errors.push({ field: 'deliveryType', message: 'Delivery type must be either "pickup" or "ship"' });
    }
 
    if (inputs.shipMethodIds && (!Array.isArray(inputs.shipMethodIds) || inputs.shipMethodIds.length === 0)) {
      errors.push({ field: 'shipMethodIds', message: 'Valid shipping method IDs array is required for multi-vendor checkout' });
    }
  }
 
  return errors;
}
 
// Helper validation functions
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
 
function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return /^[a-zA-Z\s]{2,50}$/.test(trimmed);
}
 
function isValidCityState(value: string): boolean {
  const trimmed = value.trim();
  return /^[a-zA-Z\s]{2,50}$/.test(trimmed);
}
 
function isValidPostalCode(code: string): boolean {
  const trimmed = code.trim();
  // Support various postal code formats (US ZIP, UK, Canadian, Indian PIN, etc.)
  return /^[A-Za-z0-9\s-]{3,12}$/.test(trimmed);
}
 
function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}
 
function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(\+?[1-9]\d{9,14})$/.test(cleaned);
}
 
function normalizeEndpoint(domain: string): string {
  const url = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  return `${url}/shop-api`;
}