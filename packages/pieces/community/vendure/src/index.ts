
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { getAllProducts } from "./lib/actions/get-all-products";
    export const vendure = createPiece({
      displayName: "Vendure",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/vendure.png",
      authors: [],
      actions: [getAllProducts],
      triggers: [],
    });
    
