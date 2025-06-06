
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/AuthProvider';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  brand: string;
  rating: number;
  prescription: boolean;
  inStock: boolean;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  addToWishlist: (product: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product: WishlistItem) => {
    if (!user) return;

    // Optimistic UI update - add immediately
    setWishlistItems(prev => [...prev, product]);
    toast.success(`${product.name} added to wishlist!`);

    try {
      const response = await fetch('http://localhost:8000/api/wishlist/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          productIds: [product.id]
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on failure
        setWishlistItems(prev => prev.filter(item => item.id !== product.id));
        toast.error('Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // Revert the optimistic update on error
      setWishlistItems(prev => prev.filter(item => item.id !== product.id));
      toast.error('Failed to add to wishlist');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    // Store the item for potential rollback
    const removedItem = wishlistItems.find(item => item.id === productId);
    
    // Optimistic UI update - remove immediately
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
    toast.success('Product removed from wishlist!');

    try {
      const response = await fetch('http://localhost:8000/api/wishlist/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          productId: productId
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on failure
        if (removedItem) {
          setWishlistItems(prev => [...prev, removedItem]);
        }
        toast.error('Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // Revert the optimistic update on error
      if (removedItem) {
        setWishlistItems(prev => [...prev, removedItem]);
      }
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      loading,
      fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};
