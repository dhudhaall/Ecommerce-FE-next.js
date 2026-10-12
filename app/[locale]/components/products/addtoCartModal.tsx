
"use client";

import { useState } from "react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    product: any;
};
export default function AddToCart({ isOpen, onClose, product }: Props) {
    if (!isOpen) return null;
    console.log("product", product);
    const [selectedProduct, setSelectedProduct] = useState<any>(product);
    const [selectedSize, setSelectedSize] = useState<any>(null);
    const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [sizeError, setsizeValidationError] = useState(false);
    const [qty, setQty] = useState(1);


    const closePopup = () => {
        onClose();
    }

    const calculateItemPrice = (quantity: number, size: any, addons: any[]) => {
        const basePrice = size ? Number(size.price) : Number(selectedProduct?.price || 0);
        const addonsPrice = (addons || []).reduce((sum, a) => sum + Number(a?.price || 0), 0);
        const unitPrice = basePrice + addonsPrice;
        const total = unitPrice * quantity;
        return { unitPrice, total };
    };

    const addToCart = () => {
        if (selectedProduct?.sizes?.length > 0) {
            if (!selectedSize) {
                setsizeValidationError(true);
                return;
            } else {
                setsizeValidationError(false);
            }
        }

        const { unitPrice, total } = calculateItemPrice(qty, selectedSize, selectedAddons);

        const data = {
            product: selectedProduct,
            productId: selectedProduct.id,
            size: selectedSize || null,
            addons: selectedAddons,
            quantity: qty,
            unitPrice,
            itemTotal: total,
            totalPrice: total
        };

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        
        const getAddonKey = (addonsList: any[]) =>
            (addonsList || []).map((a: any) => a.id).sort().join(",");

        const existingIndex = cart.findIndex((item: any) => {
            const sameProduct = item.productId === data.productId || item.product?.id === data.productId;
            const sameSize = (item.size?.id ?? null) === (data.size?.id ?? null);
            const sameAddons = getAddonKey(item.addons) === getAddonKey(data.addons);
            return sameProduct && sameSize && sameAddons;
        });

        if (existingIndex !== -1) {
            const existing = cart[existingIndex];
            const newQty = (Number(existing.quantity) || 1) + qty;
            const newTotal = unitPrice * newQty;
            cart[existingIndex] = {
                ...existing,
                quantity: newQty,
                unitPrice,
                itemTotal: newTotal,
                totalPrice: newTotal
            };
        } else {
            cart.push(data);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
        closePopup();
    };

    const increaseQty = () => {
        const newQty = qty + 1;
        setQty(newQty);
        updateTotal(newQty, selectedSize, selectedAddons);
    };

    const decreaseQty = () => {
        if (qty <= 1) return;

        const newQty = qty - 1;
        setQty(newQty);
        updateTotal(newQty, selectedSize, selectedAddons);
    };

    const handleQtyInput = (e: any) => {
        let value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) value = 1;
        setQty(value);
        updateTotal(value, selectedSize, selectedAddons);
    };

    const updateTotal = (quantity: number, size: any, addons: any[]) => {
        const { total } = calculateItemPrice(quantity, size, addons);
        setTotalPrice(total);
    };

    const handleSizeChange = (size: any) => {
        setSelectedSize(size);
        updateTotal(qty, size, selectedAddons);
    };

    const handleAddonChange = (addon: any) => {
        let updatedAddons;
        const exists = selectedAddons.find((a) => a.id === addon.id);

        if (exists) {
            updatedAddons = selectedAddons.filter((a) => a.id !== addon.id);
        } else {
            updatedAddons = [...selectedAddons, addon];
        }

        setSelectedAddons(updatedAddons);
        updateTotal(qty, selectedSize, updatedAddons);
    };




    return (

        <div className="popup-overlay" id="popup">
            <div className="popup">


                <div className="popup-header">
                    <h4>{selectedProduct?.name}</h4>
                    <button className="close-btn" onClick={closePopup}>✕</button>
                </div>

                <div className="flex items-center border rounded-lg overflow-hidden w-[140px]">

                    {/* Minus */}
                    <button
                        onClick={decreaseQty}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg"
                    >
                        -
                    </button>

                    {/* Input */}
                    <input
                        type="number"
                        value={qty}
                        onChange={handleQtyInput}
                        className="w-full text-center outline-none"
                        min={1}
                    />

                    {/* Plus */}
                    <button
                        onClick={increaseQty}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg"
                    >
                        +
                    </button>

                </div>


               {selectedProduct?.sizes?.length > 0  && <div className="section">
                    <h5>Choose Size</h5>
             {selectedProduct?.sizes?.length > 0 && selectedProduct?.sizes.map((size: any) => (
                    <label className="option" key={size.name} onClick={() => handleSizeChange(size)}>
                        <input type="radio" name="size" value={size.price} />
                        <span>{size.name}</span>
                        <span className="price">€{size.price}</span>
                    </label>))}

                    {sizeError && <div className="error">Please select Size to proceed</div>}
                </div>}





               {selectedProduct?.addons?.length > 0 &&  <div className="section">
                    <h5>Add Extras</h5>
                    {selectedProduct?.addons?.length > 0 && selectedProduct?.addons.map((addon: any) => (
                        <label className="option" key={"addon-" + addon?.id}>
                            <input type="checkbox" value={addon?.price}
                                checked={selectedAddons.some((a) => a.id === addon.id)}
                                onChange={() => handleAddonChange(addon)}
                            />
                            <span>{addon?.name}</span>
                            <span className="price">+ €{addon?.price}</span>
                        </label>
                    ))}

                </div>}


                <div className="popup-footer d-flex">
                    <button onClick={addToCart} className="add-btn">ADD TO CART</button>
                    <button onClick={closePopup} className="cancel-btn">Cancel</button>
                </div>

            </div>
        </div>
    )
}