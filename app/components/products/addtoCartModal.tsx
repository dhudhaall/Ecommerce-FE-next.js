
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

    const addToCart = () => {
        updateTotal(qty, selectedSize, selectedAddons);

        if(selectedProduct?.sizes?.length > 0){
            if(!selectedSize){
                setsizeValidationError(true);
                return;
            }else{
                setsizeValidationError(false)
            }
        }

        const data = {
            product: selectedProduct,
            productId:selectedProduct.id,
            size: selectedSize || null,
            addons: selectedAddons,
            quantity: qty,
            totalPrice: totalPrice
        };
      

        const cart = JSON.parse(localStorage.getItem("cart")!);
        if (cart) {
            const existingProductIndex = cart.findIndex((item: any) => item.id === data.productId);
            if (existingProductIndex !== -1) {

                cart[existingProductIndex] = data;
            } else {
                cart.push(data);
            }
            localStorage.setItem("cart", JSON.stringify(cart));
        } else {

            localStorage.setItem("cart", JSON.stringify([data]));

        }
        closePopup();

    }

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

    const updateTotal = (qty:number, size:any, addons:any) => {
        let total = selectedProduct.price;

        if (size) {
            total = 0;
            total += Number(size.price);
        }

        total = total * qty;
        console.log("total", total);
        if (addons.length > 0) {
            total += addons.reduce((sum:number, a:any) => sum + Number(a.price), 0);
        }
        console.log("total 2", total);
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
            // remove addon
            updatedAddons = selectedAddons.filter((a) => a.id !== addon.id);
        } else {
            // add addon
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