import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const pathNameCartProductsStorage = '@GoMarketplace:cartProducts';

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const jsonCartProducts = await AsyncStorage.getItem(
        pathNameCartProductsStorage,
      );
      if (jsonCartProducts) {
        setProducts(JSON.parse(jsonCartProducts));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        pathNameCartProductsStorage,
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        ),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products
          .map(product => {
            if (product.id === id) {
              return { ...product, quantity: product.quantity - 1 };
            }
            return product;
          })
          .filter(product => product.quantity >= 1),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);
      if (productIndex < 0) {
        setProducts(state => [...state, { ...product, quantity: 1 }]);
      } else {
        await increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
