"use client";

import { useState } from "react";
import AddToCart from "./addtoCartModal";

export default function CategoryTabs({ categories }: any) {
  const [active, setActive] = useState(categories?.[0] || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const openCartModal = (product: any) => {
    setSelectedProduct(product);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProduct(null);
  };

 

  return (
    <div className="w-full">

      {/* Tabs */}
      <div className="category-tabs flex overflow-x-auto no-scrollbar gap-4 pb-2">
        {categories.length > 0 && categories.map((category: any) => (
          <button
            key={category?.id}
            onClick={() => setActive(category)}
            className={`whitespace-nowrap px-5 py-2 rounded-full border transition-all ${
              active?.id === category?.id
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {category?.name}
          </button>
        ))}
      </div>

      {/* Active Content */}
      <div className="mt-6">
         <div className="products-list">
           {active?.products?.length > 0 ? active.products.map((product: any) =>  (
             <div className="product-card" key={product.id}>
                <div className="product-image">
                    <img src={product.images?.[0]?.url  || '/images/no-image.jpeg'} alt="Product 1" />
                </div>
                <div className="product-details">
                <div className="product-info">
                    <div className="product-name">{product?.name}</div>
                    <div className="product-desp">{product?.description}</div>
                    <div className="product-price">€{product?.price}</div>
                </div>
                <div className="product-actions">
                   <button onClick={() =>openCartModal(product)} type="button" className="add-to-cart-btn">Add to cart</button>

                  </div>
                </div>
            </div>)):'No products available in this category.'}
         
        </div>
      </div>


      <AddToCart
        isOpen={isOpen}
        onClose={closeModal}
        product={selectedProduct}
      />

    </div>
  );
}