export default function Banner() {
  return (
    <div className="bg-postalc[#f5efe6] min-h-[80vh] flex items-center px-10 home-banner">
      <div className="grid md:grid-cols-2 gap-10 items-center w-full">


        {/* RIGHT CONTENT */}
        <div>
          <h1 className="text-5xl font-bold text-orange-600 mb-4">
            Craving Something?
          </h1>

          <p className="text-gray-600 mb-6">
            Let’s get you started!
          </p>

          <div className="flex gap-4">
            <select className="border px-4 py-3 rounded-full w-64">
              <option>Select your location</option>
              <option>Berlin</option>
              <option>Munich</option>
            </select>

            <button className="bg-orange-500 text-white px-6 py-3 rounded-full">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}