
export default function About() {
  return (
    <>
      {/* HERO */}
      <div className="bg-[#f5efe6] py-20 text-center">
        <h1 className="text-5xl font-bold text-orange-600 mb-4">
          About Foodie
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Bringing delicious meals to your doorstep with love, quality, and speed.
        </p>
      </div>

            {/* ABOUT CONTENT */}
      <div className="py-16 px-10 grid md:grid-cols-2 gap-10 items-center">

        <div>
          <h2 className="text-3xl font-bold mb-4">Who We Are</h2>
          <p className="text-gray-600 mb-4">
            We are passionate food lovers committed to delivering high-quality
            meals from the best restaurants around you.
          </p>
          <p className="text-gray-600">
            Our platform connects you with your favorite food in just a few clicks.
          </p>
        </div>

        <img
          src="/food1.png"
          className="rounded-lg shadow-lg"
          alt="food"
        />
      </div>

            {/* FOOD GALLERY */}
      <div className="py-16 px-10">
        <h2 className="text-3xl font-bold text-center mb-10">
          Our Special Dishes
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <img src="/food1.png" className="rounded-lg" />
          <img src="/food2.png" className="rounded-lg" />
          <img src="/food3.png" className="rounded-lg" />
        </div>
      </div>

            {/* WHY US */}
      <div className="bg-gray-100 py-16 px-10">
        <h2 className="text-3xl font-bold text-center mb-10">
          Why Choose Us
        </h2>

        <div className="grid md:grid-cols-3 gap-10 text-center">

          <div>
            <h3 className="text-xl font-semibold mb-2">🚀 Fast Delivery</h3>
            <p className="text-gray-600">
              Get your food delivered quickly and fresh.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">🍽️ Best Quality</h3>
            <p className="text-gray-600">
              We partner with top-rated restaurants only.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-2">💰 Great Prices</h3>
            <p className="text-gray-600">
              Affordable meals with amazing offers.
            </p>
          </div>

        </div>
      </div>
      </>

      )
}