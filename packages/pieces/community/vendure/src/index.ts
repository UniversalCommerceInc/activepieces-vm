
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getAllProducts } from "./lib/actions/get-all-products";
import { getAllCategories } from "./lib/actions/get-all-category";
import { customerLogin} from "./lib/actions/customer-login";
import { adminLogin } from "./lib/actions/superadmin-login";
import { getCustomerCart } from "./lib/actions/get-customer-cart";
import { addItemToOrder } from "./lib/actions/add-item-to-cart";
import { adjustOrderLine } from "./lib/actions/adjust-order-line";
import { registerCustomerAccount } from "./lib/actions/customer-signup";
import { getAllOrders } from "./lib/actions/get-customer-orders";
import { getOrderById } from "./lib/actions/order-details";
import { removeOrderLine } from "./lib/actions/remove-order-line";
import { getCustomerDetails } from "./lib/actions/get-user-details";
import { checkout } from "./lib/actions/checkout";

    export const vendure = createPiece({
      displayName: "Vendure",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "http://4.240.112.193:5256/admin/assets/logo-login.webp",
      authors: [],
      actions: [getAllProducts, getAllCategories, customerLogin, adminLogin, getCustomerCart, addItemToOrder,adjustOrderLine,registerCustomerAccount,getAllOrders,getOrderById,removeOrderLine,getCustomerDetails,checkout],
      triggers: [],
    });
    