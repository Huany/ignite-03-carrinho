import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

// function getStock(id: number){

//   const stock = await (api.get<Stock>(`stock/${id}`));
//   return(
//     console.log(stock)
//   )
// }
// getStock(1);

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: product } = await api.get<Product>(`products/${productId}`);
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      const filterCart = cart.filter((cart) => cart.id === productId);

      if(filterCart.length > 0 && filterCart[0].amount === stock.amount ){
        toast.error("Quantidade solicitada fora de estoque ");
      }
      else{
        
        if (filterCart.length === 0) {
          const addProduct = { ...product, amount: 1 };
          setCart([...cart, addProduct]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, addProduct])
          );
        } else {
          const newAmount = filterCart[0].amount + 1;
          updateProductAmount({ productId, amount: newAmount });
        }
      }
      
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.some((product) => product.id === productId);

      if (productExists) {
        const removeItem = cart.filter((product) => product.id !== productId);

        setCart(removeItem);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeItem));
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if (amount > 0) {
        if (amount > stock.amount) {
          toast.error("Quantidade solicitada fora de estoque");
        } else {
          const newCart = cart.map((cartItem) => {
            if (cartItem.id === productId) {
              const updateCartItem = {
                ...cartItem,
                amount: amount,
              };
              return updateCartItem;
            }
            return cartItem;
          });

          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
